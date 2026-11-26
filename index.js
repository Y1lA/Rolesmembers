const { metro, commands, logger } = globalThis.unbound;

const GuildMemberStore = metro.findByStoreName("GuildMemberStore");
const GuildStore = metro.findByStoreName("GuildStore");
const UserStore = metro.findByStoreName("UserStore");
const Messages = metro.findByProps("sendBotMessage", "receiveMessage");

const cmdHandle = commands.createCommands("com.sohaib.rolemembers");

export function start() {
    cmdHandle.registerCommand({
        name: "rolemembers",
        displayName: "rolemembers",
        description: "عرض الأعضاء الحاملين لرتبة محددة",
        displayDescription: "عرض الأعضاء الحاملين لرتبة محددة",
        type: 1,
        inputType: 1,
        applicationId: "-1",
        options: [
            {
                name: "role",
                displayName: "role",
                description: "اختر الرتبة",
                displayDescription: "اختر الرتبة",
                type: 8,
                required: true
            }
        ],
        execute(args, ctx) {
            const roleId = args.find(a => a.name === "role")?.value;
            const guildId = ctx.guild?.id;
            const channelId = ctx.channel?.id;

            if (!guildId || !roleId) {
                Messages.sendBotMessage(channelId, "❌ استخدم الأمر داخل سيرفر واختر رتبة.");
                return;
            }

            const guild = GuildStore.getGuild(guildId);
            const roleName = guild?.roles?.[roleId]?.name || "الرتبة";
            const members = GuildMemberStore.getMembers(guildId) || [];
            const matched = members.filter(m =>
                roleId === guildId ? true : (m.roles && m.roles.includes(roleId))
            );

            if (matched.length === 0) {
                Messages.sendBotMessage(
                    channelId,
                    `⚠️ لا يوجد أعضاء في الكاش للرتبة **${roleName}**. افتح قائمة الأعضاء الجانبية ومرر للأسفل ثم أعد المحاولة.`
                );
                return;
            }

            const list = matched.map((m, i) => {
                const u = UserStore.getUser(m.userId);
                return `**${i + 1}.** <@${m.userId}> (\`${u ? u.username : m.userId}\`)`;
            });

            let out = `👥 **أعضاء رتبة ${roleName} (${matched.length}):**\n\n`;
            for (const line of list) {
                if ((out + line).length > 1900) {
                    Messages.sendBotMessage(channelId, out);
                    out = "";
                }
                out += line + "\n";
            }
            if (out.trim()) Messages.sendBotMessage(channelId, out);
        }
    });

    logger.log("RoleMembers started.");
}
