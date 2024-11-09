import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProposalService } from 'src/services/ProposalService.service';

@ApiBearerAuth()
@ApiTags('Proposal Controller')
@Controller('proposal')
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}
}
