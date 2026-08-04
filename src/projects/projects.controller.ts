import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // 🔒 POST /projects -> UMKM membuat proyek baru (status adminApproved: false)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.UMKM)
  @Post()
  create(
    @Body() createProjectDto: CreateProjectDto,
    @GetUser('sub') userId: string,
  ) {
    return this.projectsService.create(createProjectDto, userId);
  }

  // 🌐 GET /projects -> Lihat proyek publik (hanya yang adminApproved: true)
  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.projectsService.findAll(category, search);
  }

  // 🔒 GET /projects/pending -> Admin melihat daftar proyek yang menunggu persetujuan
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('pending')
  findPendingApproval() {
    return this.projectsService.findPendingApproval();
  }

  // 🔒 PATCH /projects/:id/approve -> Admin menyetujui proyek UMKM
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/approve')
  approveProject(@Param('id') id: string) {
    return this.projectsService.approveProject(id);
  }

  // 🔒 GET /projects/my -> UMKM melihat semua proyek yang pernah dibuatnya
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.UMKM)
  @Get('my')
  findMyProjects(@GetUser('sub') userId: string) {
    return this.projectsService.findMyProjects(userId);
  }

  // 🌐 GET /projects/:id -> Detail proyek
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  // 🔒 PATCH /projects/:id -> UMKM mengedit proyek miliknya
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.UMKM)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @GetUser('sub') userId: string,
  ) {
    return this.projectsService.update(id, updateProjectDto, userId);
  }

  // 🔒 DELETE /projects/:id -> UMKM menghapus proyek miliknya
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.UMKM)
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.projectsService.remove(id, userId);
  }
}