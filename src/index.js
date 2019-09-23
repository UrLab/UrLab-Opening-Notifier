// Load the configuration file from `.env` (in CWD)
require('dotenv').config()

const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const telegraf = new Telegraf(process.env.TELEGRAM_TOKEN)
const telegram = new Telegram(process.env.TELEGRAM_TOKEN)

const FileSync = require('lowdb/adapters/FileSync')
const db = require('lowdb')(new FileSync('db.json'))

db.defaults({
    // string[]
    chats: []
}).write()

const { UrLabTracker } = require('./tracker')
const tracker = new UrLabTracker(60 * 1000)

// Adds the chat identifier to the chats to notify
telegraf.start((ctx, next) => {
    // Prevent duplicates by removing it first
    // If duplicate: messages will be sent multiple times to the same person
    db.get('chats')
        .remove(chatId => chatId === ctx.chat.id)
        .write()

    db.get('chats')
        .push(ctx.chat.id)
        .write()

    ctx.reply('You will now receive open and closing events from UrLab!')

    console.log(
        `[CHAT ADD+] ${ctx.chat.first_name} ${ctx.chat.last_name} (${ctx.chat.username})`
    )
})

telegraf.command('stop', ctx => {
    db.get('chats')
        .remove(chatId => chatId === ctx.chat.id)
        .write()

    ctx.reply('You will not receive status updates anymore.')

    console.log(
        `[CHAT REM-] ${ctx.chat.first_name} ${ctx.chat.last_name} (${ctx.chat.username})`
    )
})

telegraf.launch().then(() => {
    console.log('Bot started!')
})

tracker.on('update', async isOpen => {
    let chatIds = db.get('chats').value()
    let messageContent = isOpen
        ? `The HackerSpace is now open! 🥳`
        : `The HackerSpace is now closed.`

    for (let chatId of chatIds) {
        await telegram.sendMessage(chatId, messageContent).catch(e => {
            db.get('chats')
                .remove(chatId => chatId !== chatId)
                .write()
        })
    }

    console.log(`[NOTIFY] HackerSpace is now ${isOpen ? 'open' : 'closed'}`)
})
