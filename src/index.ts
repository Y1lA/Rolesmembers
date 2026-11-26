import { findByProps, findByStoreName } from "@unbound/metro";
import { createCommands } from "@unbound/commands";

const GuildMemberStore = findByStoreName("GuildMemberStore");
const GuildStore = findByStoreName("GuildStore");
const UserStore = findByStoreName("UserStore");
const Messages = findByProps("sendBotMessage", "receiveMessage");

const commands = createCommands("com.sohaib.rolemembers");

export function start() {
    commands.registerCommand({
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
        execute(args: any[], ctx: any) {
            const roleId = args.find((a: any) => a.name === "role")?.value;
            const guildId = ctx.guild?.id;
            const channelId = ctx.channel?.id;

            if (!guildId || !roleId) {
                Messages.sendBotMessage(channelId, "❌ استخدم الأمر داخل سيرفر واختر رتبة.");
                return;
            }

            const guild = GuildStore.getGuild(guildId);
            const roleName = guild?.roles?.[roleId]?.name || "الرتبة";
            const members = GuildMemberStore.getMembers(guildId) || [];
            const matched = members.filter((m: any) =>
                roleId === guildId ? true : (m.roles && m.roles.includes(roleId))
            );

            if (matched.length === 0) {
                Messages.sendBotMessage(
                    channelId,
                    `⚠️ لا يوجد أعضاء في الكاش للرتبة **${roleName}**. افتح قائمة الأعضاء الجانبية ومرر للأسفل ثم أعد المحاولة.`
                );
                return;
            }

            const list = matched.map((m: any, i: number) => {
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
}
