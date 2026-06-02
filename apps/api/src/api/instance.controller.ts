import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { INSTANCE_PORT, InstancePort } from '@motor100/shared';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { AdminGuard } from './admin.guard';
import { CreateInstanceDto } from './dto';

/**
 * Admin-only channel instance management. Connect/monitor/remove WhatsApp
 * numbers entirely from within Motor100 — no UAZAPI panel.
 */
@Controller('api/instances')
@UseGuards(SupabaseAuthGuard, AdminGuard)
export class InstanceController {
  constructor(
    @Inject(INSTANCE_PORT) private readonly instances: InstancePort,
  ) {}

  @Get()
  async list() {
    return this.instances.findAll();
  }

  @Post()
  async create(@Body() body: CreateInstanceDto) {
    const instance = await this.instances.create({ name: body.name });
    // Register the per-instance webhook right after creation so inbound
    // messages route without manual setup.
    await this.instances.registerWebhook(instance.id);
    return instance;
  }

  @Get(':id/qr')
  async qrCode(@Param('id') id: string) {
    return this.instances.getQrCode(id);
  }

  @Get(':id/status')
  async status(@Param('id') id: string) {
    return { status: await this.instances.getStatus(id) };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.instances.remove(id);
    return { removed: true };
  }
}
