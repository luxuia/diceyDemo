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

        for (let i=0; i<role.dice_count; ++i) {

            let dice = role.dice_nodes[i]
            if (dice && dice.alive) {
                cc.log('try use dice idx:', dice.idx, dice.point)

                for (let j=0;j<battlemain.spell_handlers.length;++j) {
                    let spell = battlemain.spell_handlers[j]
                    if (spell.alive && spell.spell_cfg.max_limit >= dice.point) {

                        tween_time = role.try_use_spell(spell, dice)
                        casted = true

                        break
                    }
                }
            }
            if (casted)
                break
        }
        if (!casted) {
        cc.log(`simple ai step tween_time ${tween_time} next turn`)
            // TODO 改成 async wait的形式
            setTimeout(() => {
                battlemain.next_turn()
            }, tween_time*1000+500);
        } else {
        cc.log(`simple ai step tween_time ${tween_time} simple ai`)
            setTimeout(() => {
               AI.SimpleAI() 
            }, tween_time*1000+500);
        }
    }
}