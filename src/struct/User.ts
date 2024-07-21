import Group from "./Group.js";
import Users from "../shared/models/VkUsersModel.js";
import Cache from "../lib/Cache.js";
import { Keyboard } from "vk-io";
import BaseUser from "../shared/structures/User.js";

export default class User extends BaseUser {
    group?: Group;
    token?: string | null;

    notifications: boolean = false;
    emoji: boolean = true;
    showSettings: boolean = true;
    showTeachers: boolean = true;

    /**
     * Инициализация
     */
    async init() {
        let userData = await Users.findOne({ userId: this.id }).exec();

        if(userData?.inst_id && userData?.group) {
            await this.setGroup(userData.group, userData.inst_id);

            this.notifications = userData?.notifications ?? false;
            this.emoji = userData?.emoji ?? true;
            this.showSettings = userData?.showSettings ?? true;
            this.showTeachers = userData?.showTeachers ?? true;

            this.token = userData?.token;
        }
    }

    /**
     * Обновление данных
     */
    async updateData(opt: { instId: number, group: string }) {
        await Users.findOneAndUpdate({userId: this.id}, { inst_id: opt.instId, group: opt.group }, { upsert: true });

        this.setGroup(opt.group, opt.instId);
    }

    /**
     * Установка текущей группы у человека
     */
    async setGroup(group:string, inst_id:number | string) {
        this.group = Cache.getGroup(group, +inst_id);
    }

    /**
     * Установка токена
     */
    async setToken(token:string) {
        this.token = token;

        let userData = await Users.findOne({userId: this.id}).exec();

        if(userData) {
            userData.token = token;
            userData.save().catch(console.log);
        }
    }

    /**
     * Удаление пользователя из БД
     */
    async delete() {
        return Users.findOneAndDelete({userId: this.id});
        // TODO: Сделать удаление из массива Cache.users
    }

    /**
     * Получение главной клавиатуры
     */
    getMainKeyboard() {
        let keyboard = Keyboard.builder().textButton({
            label: (this.emoji ? "⏺️ " : "") + "Сегодняшнее",
            color: 'primary'
        }).textButton({
            label: (this.emoji ? "▶️ " : "") + "Завтрашнее",
            color: 'primary'
        }).row().textButton({
            label: (this.emoji ? "⏩ " : "") + "Ближайшее",
            color: 'primary'
        }).textButton({
            label: (this.emoji ? "🔀 " : "") + "Выбрать день",
            color: 'primary'
        });

        if(this.showTeachers) keyboard.row().textButton({ label: (this.emoji ? "👨‍🏫 " : "") + "Расписания преподавателей" })
        if(this.showSettings) keyboard.row().textButton({ label: (this.emoji ? "⚙️ " : "") + "Настройки" })

        return keyboard;
    }

    /**
     * Получение клавиатуры настроек
     */
    getSettingsKeyboard() {
        return [
            [
                {
                    text: this.notifications ? ( (this.emoji ? "🔕 " : "") + "Выключить напоминания") : ((this.emoji ? "🔔 " : "") + "Включить напоминания")
                },{
                    text: this.emoji ? ( (this.emoji ? "🙅‍♂️ " : "") + "Выключить эмодзи") : "Включить эмодзи" // Тут нет эмодзи, потому что оно тут в любом случае будет отсутствовать
                }
            ],[
                {
                    text: (this.emoji ? "⚙️ " : "") + "Перенастроить бота"
                },{
                    text: this.showSettings ? ( (this.emoji ? "⚙️ " : "") + "Убрать настройки") : ((this.emoji ? "⚙️ " : "") + "Показывать настройки")
                }
            ],[
                { // TODO: Заменить емодзи на другое
                    text: this.showTeachers ? ( (this.emoji ? "⚙️ " : "") + "Убрать расписания преподавателей") : ((this.emoji ? "⚙️ " : "") + "Показывать расписания преподавателей")
                }
            ],[
                {
                    text: (this.emoji ? "🛑 " : "") + "Отмена"
                }
            ]
        ];
    }

    async updateLastActivity() {
        let user = await Users.findOne({userId: this.id}).exec();

        if(user) {
            user.lastActivity = new Date();
            user.save().catch(console.log);
        }
    }
}