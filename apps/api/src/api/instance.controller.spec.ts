import { Test, TestingModule } from '@nestjs/testing';
import { INSTANCE_PORT } from '@motor100/shared';
import { InstanceController } from './instance.controller';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { AdminGuard } from './admin.guard';

const allow = { canActivate: () => true };

describe('InstanceController', () => {
  let controller: InstanceController;
  let port: any;

  beforeEach(async () => {
    port = {
      findAll: jest.fn().mockResolvedValue([{ id: 'i1', name: 'Vendas' }]),
      create: jest.fn().mockResolvedValue({ id: 'i1', name: 'Vendas' }),
      registerWebhook: jest.fn().mockResolvedValue(undefined),
      getQrCode: jest.fn().mockResolvedValue({ base64: 'qr' }),
      getStatus: jest.fn().mockResolvedValue('connected'),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstanceController],
      providers: [{ provide: INSTANCE_PORT, useValue: port }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(allow)
      .overrideGuard(AdminGuard)
      .useValue(allow)
      .compile();

    controller = module.get(InstanceController);
  });

  it('lists instances', async () => {
    expect(await controller.list()).toEqual([{ id: 'i1', name: 'Vendas' }]);
  });

  it('creates an instance and registers its webhook', async () => {
    const result = await controller.create({ name: 'Vendas' });

    expect(port.create).toHaveBeenCalledWith({ name: 'Vendas' });
    expect(port.registerWebhook).toHaveBeenCalledWith('i1');
    expect(result).toEqual({ id: 'i1', name: 'Vendas' });
  });

  it('returns the QR code', async () => {
    expect(await controller.qrCode('i1')).toEqual({ base64: 'qr' });
  });

  it('returns the connection status', async () => {
    expect(await controller.status('i1')).toEqual({ status: 'connected' });
  });

  it('removes an instance', async () => {
    expect(await controller.remove('i1')).toEqual({ removed: true });
    expect(port.remove).toHaveBeenCalledWith('i1');
  });
});
