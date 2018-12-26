
import './utils/struct'
import BattleMain from './battle';
import Util from './utils/util'

// 技能的一些额外效果
export default class SpellFuncs {

    // 消耗当前的骰子，返回技能对应的骰子
    static give_dices(min:number, max:number, delay?:number) {
        let role = BattleMain.instance.get_attacker()
        min = Math.max(Math.min(min, 6), 1)
        max = Math.max(Math.min(max, 6), 1)

        let point = Util.random_int(min, max)

        cc.log(`give dice min ${min} max: ${max} ret ${point}`)

        delay = delay?delay:0.1
        role.give_dice(point, delay)
        return delay
    }

    static add_defence(total_dice_point:number) {

    }
}