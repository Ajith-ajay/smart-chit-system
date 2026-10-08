import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly repository: ReportsRepository) {}

  dashboard(from?: string, to?: string) {
    return this.repository.dashboard(this.parse(from), this.parse(to, true));
  }

  async batch(id: string) {
    const result = await this.repository.batch(id);
    if (!result) throw new NotFoundException('Batch not found.');
    return result;
  }

  async enrollment(id: string) {
    const result = await this.repository.enrollment(id);
    if (!result) throw new NotFoundException('Enrollment not found.');
    return result;
  }

  collection(from?: string, to?: string) {
    return this.repository.collectionReport(
      this.parse(from),
      this.parse(to, true),
    );
  }
  withdrawals(from?: string, to?: string) {
    return this.repository.withdrawalReport(
      this.parse(from),
      this.parse(to, true),
    );
  }

  private parse(value?: string, endOfDay = false) {
    if (!value) return undefined;
    const date = new Date(
      endOfDay
        ? `${value.slice(0, 10)}T23:59:59.999Z`
        : `${value.slice(0, 10)}T00:00:00.000Z`,
    );
    if (Number.isNaN(date.getTime()))
      throw new UnprocessableEntityException('Invalid report date.');
    return date;
  }
}
