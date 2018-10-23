import { inject, injectable } from 'inversify'
import * as Pino from 'pino'

import { childWithFileName } from 'Helpers/Logging'
import { Messaging } from 'Messaging/Messaging'

import { ExchangeConfiguration } from './ExchangeConfiguration'
import { HealthController } from './HealthController'

@injectable()
export class Router {
  private readonly logger: Pino.Logger
  private readonly messaging: Messaging
  private readonly controller: HealthController
  private readonly exchange: ExchangeConfiguration

  constructor(
    @inject('Logger') logger: Pino.Logger,
    @inject('Messaging') messaging: Messaging,
    @inject('HealthController') controller: HealthController,
    @inject('ExchangeConfiguration') exchange: ExchangeConfiguration
  ) {
    this.logger = childWithFileName(logger, __filename)
    this.messaging = messaging
    this.controller = controller
    this.exchange = exchange
  }

  async start() {
    await this.messaging.consume(this.exchange.getHealth, this.onGetHealth)
  }

  onGetHealth = async () => {
    const logger = this.logger.child({ method: 'onGetHealth' })
    try {
      await this.controller.refreshWalletInfo()
      await this.controller.refreshBlockchainInfo()
      await this.controller.refreshNetworkInfo()
      await this.controller.refreshIPFSInfo()
    } catch (error) {
      logger.error({ error }, 'Failed to getHealthInfo')
    }
  }
}