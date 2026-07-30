import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import {
  ConsentNotRequired,
  CurrentUser,
  RequestPrincipal,
} from '../../common/security/security.decorators';
import { RegisterLegalDecisionDto, WithdrawOptionalConsentDto } from './consent.dto';
import { ConsentService } from './consent.service';

@Controller('legal')
@ConsentNotRequired()
export class ConsentController {
  constructor(private readonly consent: ConsentService) {}

  @Get('current')
  current() {
    return this.consent.current();
  }

  @Post('events')
  register(
    @CurrentUser() user: RequestPrincipal,
    @Body() dto: RegisterLegalDecisionDto,
    @Req() request: Request,
  ) {
    return this.consent.register(user.id_usuario, dto, request.ip || 'unknown');
  }

  @Post('optional/withdraw')
  withdraw(
    @CurrentUser() user: RequestPrincipal,
    @Body() dto: WithdrawOptionalConsentDto,
    @Req() request: Request,
  ) {
    return this.consent.withdrawOptional(user.id_usuario, dto, request.ip || 'unknown');
  }
}
