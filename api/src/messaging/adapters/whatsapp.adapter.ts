// src/messaging/adapters/whatsapp.adapter.ts

import { Client, LocalAuth, Message as WaMessage } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { MessageChannelPort } from '../domain/message-channel.port';
import { IncomingMessagePublisher } from 'src/queue/publishers/incoming-message.publisher';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import * as fs from 'fs';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
const SESSION_PATH = '/app/.wwebjs_auth/session-bot-garota';

@Injectable()
export class WhatsappAdapter implements OnModuleInit, OnModuleDestroy, MessageChannelPort {
  channelName = 'whatsapp';
  private client: Client;
  private lastQrBase64: string | null = null;
  private ready = false;
  

  constructor(
    private readonly incomingPublisher: IncomingMessagePublisher,
  ) {}

    clearChromiumLocks(dir: string) {
        if (existsSync(SESSION_PATH)) {
            rmSync(join(SESSION_PATH, 'SingletonLock'), { force: true });
            rmSync(join(SESSION_PATH, 'SingletonSocket'), { force: true });
            rmSync(join(SESSION_PATH, 'SingletonCookie'), { force: true });
        }

        const files = [
            'SingletonLock',
            'SingletonSocket',
            'SingletonCookie',
        ];

        for (const file of files) {
            const path = `${dir}/${file}`;
            if (fs.existsSync(path)) {
            fs.unlinkSync(path);
            }
        }
    }

  async onModuleInit() {
    const provider = process.env.WHATSAPP_PROVIDER;
    if (provider === 'web') return await this.clientCreate();
    //await new Promise(res => setTimeout(res, 5000));
  }

  async clientCreate() {
    this.clearChromiumLocks('/app/.chrome');
    
    this.client = new Client({
        authStrategy: new LocalAuth({
            clientId: 'bot-garota',
            dataPath: '/app/.wwebjs_auth',
        }),
        puppeteer: {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            protocolTimeout: 300_000,
            headless: 'new',
            args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process',
            '--no-zygote',
            ],
            timeout: 300_000
        },
        takeoverOnConflict: true,
        takeoverTimeoutMs: 0,
        restartOnAuthFail: true,
        webVersionCache: {
          type: "remote",
          remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
        },
        
    })

    this.client.on('qr', async (qr) => {
        this.lastQrBase64 = await qrcode.toDataURL(qr);
        this.ready = false;
        console.log('📲 QR Code gerado (base64)');
    });

    this.client.on('ready', async () => {
      this.ready = true;
      this.lastQrBase64 = null;
      console.log('✅ WhatsApp conectado com sucesso')

      //await this.client.sendMessage('47997051924@c.us', 'teste isolado');

    })

    this.client.on('authenticated', () => {
      console.log('🔐 Sessão autenticada')      
    })

    this.client.on('auth_failure', (msg) => {
      console.error('❌ Falha de autenticação', msg)
    })

    this.client.on('message', (msg: WaMessage) => {
      this.handleIncoming(msg)
    })
    
    this.client.initialize();
  }

  private async handleIncoming(msg: WaMessage) {
    console.log('📩 Mensagem recebida:?', msg.from, msg.body);

    await this.incomingPublisher.publish({
      from: msg.from,
      content: msg.body,
      channel: this.channelName,
      timestamp: Date.now(),
    });
  }

  async send(message) {
   // await this.onModuleInit();
    if (!this.client || !this.ready) {
      console.log('⚠️ WhatsApp ainda não está pronto');
      return;
    }else{
      console.log('State:', await this.client.getState());
      console.log('Info:', this.client.info);
      this.client.on('ready', async () => {
        console.log('📤 Enviando mensagem via WhatsApp:??', message.to, message.content);
        await this.client.sendMessage(message.to, message.content);
      });
      
     // await this.client.sendMessage(message.to, message.content);
    }
    
  }

  async onModuleDestroy() {
    await this.client.destroy()
  }

  // 🔽 NOVO
  getQrStatus() {
    return {
      ready: this.ready,
      qr: this.lastQrBase64,
    };
  }
}

