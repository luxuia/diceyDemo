
import './utils/struct'
import BattleMain from './battle';
import Util from './utils/util'

// 技能的一些额外效果
export default class SpellFuncs {

    // 消耗当前的骰子，返回技能对应的骰子
    static give_dices(spell:ISpell, min:number, max:number) {
        let role = BattleMain.instance.get_attacker()
        let point = Util.random_int(min, max)
        role.give_dices(point)
    }
}