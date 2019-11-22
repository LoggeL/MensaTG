const TelegramBot = require('node-telegram-bot-api')
const cheerio = require('cheerio')
const axios = require('axios')
const cron = require('node-cron')

const token = require('./token.json')

const baseUrl = 'https://www.mensa-kl.de/'

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: false });

const chatId = '@MensaTUKL'

cron.schedule('0 12 * * 7', () => {
    console.log('Fired cron!')
    axios.get('https://www.mensa-kl.de').then(async response => {
        //console.log(response)
        let $ = cheerio.load(response.data)
        let output = []
        $('.week0').each(function (index, e) {
            output[index] = []
            var day = $.load(e)
            var date = day('.date')
            var ausgabe = day('.ui-widget-header')
            var text = day('p[onclick]')
            var bild = day('img.mimg')
            var preis = day('.preis')
            for (let i = 0; i < text.length; i++) {
                output[index].push({
                    date: date.text().trim(),
                    ausgabe: day(ausgabe[i]).text().trim(),
                    bild: day(bild[i]).attr('src'),
                    text: day(text[i]).text().trim().replace(/  +/g, ' '),
                    preis: day(preis[i]).text().trim()
                })
            }
        })
        for (let i = 0; i < 5; i++) {
            let day = output[i]
            await bot.sendMessage(chatId, '='.repeat(20) + '\n*' + day[0].date + '*\n' + '='.repeat(20), { parse_mode: 'Markdown' })

            for (let j = 0; j < day.length; j++) {
                let food = day[j]
                const text = '*' + food.ausgabe + '*\n' + food.text + (food.preis ? '\n*' + food.preis + '*' : '')
                if (food.bild) {
                    await bot.sendPhoto(chatId, baseUrl + food.bild, { caption: text, parse_mode: 'Markdown' })
                }
                else {
                    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' })
                }
            }
        }
    }).catch(console.error)
})


//bot.sendMessage(chatId, 'Hello World').then(m => console.log("Message sent")).catch(console.error)


