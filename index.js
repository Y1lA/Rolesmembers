const api = window.unbound || window.bunny || window.vendetta;
const { metro, commands, logger } = api;
const { findByStoreName, findByProps } = metro;

const GuildMemberStore = findByStoreName("GuildMemberStore");
const GuildStore = findByStoreName("GuildStore");
const UserStore = findByStoreName("UserStore");
const MessageActions = findByProps("sendBotMessage", "receiveMessage");

let unregisterCommand;

export default {
    onLoad() {
        try {
            unregisterCommand = commands.registerCommand({
                name: "rolemembers",
                displayName: "rolemembers",
                description: "عرض جميع الأعضاء الحاملين لرتبة محددة في السيرفر",
                displayDescription: "عرض جميع الأعضاء الحاملين لرتبة محددة في السيرفر",
                type: 1, // CHAT_INPUT
                inputType: 1, // BUILT_IN
                applicationId: "-1",
                options: [
                    {
                        name: "role",
                        displayName: "role",
                        description: "اختر الرتبة لعرض أعضائها",
                        displayDescription: "اختر الرتبة لعرض أعضائها",
                        type: 8, // ROLE
                        required: true
                    }
                ],
                execute(args, ctx) {
                    const roleOption = args.find(a => a.name === "role");
                    const roleId = roleOption?.value;
                    const guildId = ctx.guild?.id;
                    const channelId = ctx.channel?.id;

                    if (!guildId || !roleId) {
                        MessageActions.sendBotMessage(channelId, "❌ يجب استخدام هذا الأمر داخل سيرفر واختيار رتبة صحيحة.");
                        return;
                    }

                    const guild = GuildStore.getGuild(guildId);
                    const role = guild?.roles?.[roleId];
                    const roleName = role?.name || "الرتبة المحددة";

                    // جلب الأعضاء المحملين في الذاكرة المؤقتة للسيرفر
                    const members = GuildMemberStore.getMembers(guildId) || [];
                    const matchedMembers = members.filter(m =>
                        roleId === guildId ? true : (m.roles && m.roles.includes(roleId))
                    );

                    if (matchedMembers.length === 0) {
                        MessageActions.sendBotMessage(
                            channelId,
                            `⚠️ لا يوجد أعضاء ظاهرون في الكاش حالياً للرتبة **${roleName}**.\n*تلميح: افتح قائمة الأعضاء الجانبية في السيرفر ومرر للأسفل لتحميل بقية الأعضاء ثم أعد المحاولة.*`
                        );
                        return;
                    }

                    const formattedList = matchedMembers.map((m, idx) => {
                        const user = UserStore.getUser(m.userId);
                        const tag = user ? `${user.username}` : m.userId;
                        return `**${idx + 1}.** <@${m.userId}> (\`${tag}\`)`;
                    });

                    // تقسيم النص إذا كان طويلاً لتجنب حد 2000 حرف في ديسكورد
                    const header = `👥 **أعضاء رتبة ${roleName} (${matchedMembers.length} عضو):**\n\n`;
                    let output = header;

                    for (const line of formattedList) {
                        if ((output + line + "\n").length > 1900) {
                            MessageActions.sendBotMessage(channelId, output);
                            output = "";
                        }
                        output += line + "\n";
                    }

                    if (output.trim().length > 0) {
                        MessageActions.sendBotMessage(channelId, output);
                    }
                }
            });
            logger.log("[RoleMembers] Loaded successfully.");
        } catch (err) {
            logger.error("[RoleMembers] Failed to load:", err);
        }
    },

    onUnload() {
        if (typeof unregisterCommand === "function") {
            unregisterCommand();
        }
    }
};
