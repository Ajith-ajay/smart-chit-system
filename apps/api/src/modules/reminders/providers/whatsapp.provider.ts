import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export interface WhatsAppMessage {
  to: string;
  message: string;
}

@Injectable()
export class WhatsAppProvider {
  async send(input: WhatsAppMessage) {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const graphVersion = process.env.WHATSAPP_GRAPH_VERSION;
    if (!graphVersion) {
      throw new ServiceUnavailableException(
        'WhatsApp is not configured. Set WHATSAPP_GRAPH_VERSION.',
      );
    }

    if (!token || !phoneNumberId) {
      throw new ServiceUnavailableException(
        'WhatsApp is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.',
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizePhone(input.to),
          type: 'text',
          text: { preview_url: false, body: input.message },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new ServiceUnavailableException(
        `WhatsApp message failed (${response.status}): ${body.slice(0, 500)}`,
      );
    }

    return response.json() as Promise<Record<string, unknown>>;
  }
}

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, '');
}
