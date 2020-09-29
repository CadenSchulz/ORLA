module.exports = async (client) => {
    const Discord = require('discord.js')
    const moment = require('moment-timezone')

    const events = await client.sql('SELECT * FROM `tournaments` WHERE `reminded`=0 AND `rtime`<'+(moment().unix()+3600))

    for (const event of events) {
        const defaultImage = 'https://orla.pro/assets/hosts/default.png'

        const data = {
            seriesImage: defaultImage
        }
        
        if (client.hosts[event.host] !== undefined) {
            for (const id of Object.keys(client.servers)) {
                data['color'] = (client.hosts[event.host].color !== null) ? client.hosts[event.host].color : client.config.color
                data['logo'] = (client.hosts[event.host].log !== null) ? client.hosts[event.host].logo : defaultImage
                if (client.hosts[event.host].series !== null) {
                    data['series'] = client.hosts[event.host].series[event.series].title
                    data['seriesImage'] = `https://orla.pro/assets/series/${client.hosts[event.host].series[event.series].image}.png`
                }

                const topen = (event.topen === 1) ? '' : '\n\n⚠️ ***Registration requires an invite***'
                const stream = (event.stream === null) ? '*Unfortunately this tournament is not planned to be streamed.*' : `*You can watch this tournament's live stream at:*\n➡️** ${event.stream} **`
                const thumbnail = (data['seriesImage'] !== defaultImage) ? data['seriesImage'] : data['logo']

                const Embed = new Discord.MessageEmbed()
                    .setColor(data['color'])
                    .setTitle(`\`${event.title}\``)
                    .setURL(event.link)
                    .setAuthor(client.hosts[event.host].title, data['logo'])
                    .setFooter('Tournament information provided by https://orla.pro', client.config.logo)
                    .setDescription(
                        '```fix\nREGISTRATION CLOSES IN ONE HOUR\n```\nRegistration for this tournament closes at **'
                        +moment.unix(event.rtime).tz(client.servers[id].timezone).format('h:mma z')
                        +'**. To register or watch the tournament, follow the links below. The tournament starts at **'
                        +moment.unix(event.ttime).tz(client.servers[id].timezone).format('h:mma z')+'**.'
                    )
                    .addField(`🔗 **__Links__**`, `*You can enter this tournament by registering at:*\n➡️** ${event.link} **${topen}\n\n${stream}`)
                    .setThumbnail(thumbnail)
                
                const channel = client.channels.cache.find(channels => channels.id === client.servers[id].notifications)
                channel.send(`<@&${client.servers[id].pingrole}>`, Embed)
            }
            
            await client.sql('UPDATE `tournaments` SET `reminded`=1 WHERE `title`="'+event.title+'"')
        }
    }
}