import Role from './role'
import BattleMain from './battle';

export default class AI {
    static run_ai(role:Role) {
        setTimeout(() => {
           AI.SimpleAI() 
        }, 1500);
    }

    static SimpleAI() {
        let casted =false
        let battlemain = BattleMain.instance
        let role = battlemain.get_attacker()
        let tween_time = 1

        for (let i=0; i<role.dice_nodes.length; ++i) {

            let dice = role.dice_nodes[i]
            cc.log('index ', i, dice.alive, dice.point)
            if (dice && dice.alive) {
                cc.log('ai try use dice idx:', dice.index, dice.point)

                for (let j=0;j<role.spell_nodes.length;++j) {
                    let spell = role.spell_nodes[j]
                    if (spell.alive && role.can_use_spell(spell, dice)) {
                        tween_time = role.try_use_spell(spell, dice)
                        casted = true

                        break
                    }
                }
            }
            if (casted)
                break
        }
        setTimeout(() => {
            if (!casted) {
                cc.log(`simple ai step tween_time ${tween_time} next turn`)
                // TODO 改成 async wait的形式
                battlemain.next_turn()
            } else {
                cc.log(`simple ai step tween_time ${tween_time} simple ai`)
                AI.SimpleAI() 
            }
        }, tween_time*1000+500);
    }
}