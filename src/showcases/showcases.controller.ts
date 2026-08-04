import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShowcasesService } from './showcases.service';
import { CreateShowcaseDto } from './dto/create-showcase.dto';
import { UpdateShowcaseDto } from './dto/update-showcase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('showcases')
export class ShowcasesController {
  constructor(private readonly showcasesService: ShowcasesService) {}

  // 🔒 POST /showcases -> Publikasikan showcase proyek
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() dto: CreateShowcaseDto,
    @GetUser('sub') userId: string,
  ) {
    return this.showcasesService.create(dto, userId);
  }

  // 🌐 GET /showcases -> Lihat daftar showcase (?featured=true)
  @Get()
  findAll(@Query('featured') featured?: string) {
    const isFeatured = featured === 'true' ? true : featured === 'false' ? false : undefined;
    return this.showcasesService.findAll(isFeatured);
  }

  // 🌐 GET /showcases/:id -> Detail showcase
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.showcasesService.findOne(id);
  }

  // 🔒 PATCH /showcases/:id -> Edit showcase
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShowcaseDto,
    @GetUser('sub') userId: string,
  ) {
    return this.showcasesService.update(id, dto, userId);
  }

  // 🔒 DELETE /showcases/:id -> Hapus showcase
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
  ) {
    return this.showcasesService.remove(id, userId);
  }
}
