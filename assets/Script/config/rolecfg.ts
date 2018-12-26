import SpellFuncs from '../spell_funcs'
import Util from '../utils/util';

export default class RoleCfg {
    static warrier:IRoleCfg = {
        name:"战士",
        dice_count: 2,        
        hp:24,
        spells : [
            {
                name:'剑',
                desc:'造成<img src="attack"/>{total_dice_points}点伤害',
                slot_count:1,
                slot_desc:'最大\n{max_limit}',
                max_limit:5,
                damage_func:function(total_dice_points) {
                    return total_dice_points
                },
                avaliable_count :1,
            },
            {
                name:'投掷',
                desc:'重新投出一个骰子\n(本回合可使用{avaliable_count}次)',
                slot_count:1,
                slot_desc:'',
                avaliable_count:3,
                damage_func:function(total_dice_points) {
                    return 0
                },
                effect_func:function(total_dice_points){
                    return SpellFuncs.give_dices(1, 6)
                },
                max_limit:6
            },
        ],

    }
    static robot:IRoleCfg = {
        name:'盗贼',
        dice_count:2,
        hp:24,
        spells:[
            {
                name:'匕首',
                slot_desc:'最大\n{max_limit}',
                max_limit:3,
                slot_count:1,

                desc:'造成<img src="attack"/>{total_dice_points}点伤害\n(可重复使用)',
                avaliable_count:1,//Number.MAX_VALUE,
                damage_func:function(total_dice_points) {
                    return total_dice_points
                }
            },
            {
                name:'撬锁器',
                slot_desc:'',
                slot_count:1,
                desc:'将一个骰子拆分成两个',
                damage_func:function(total_dice_points) {
                    return 0
                },
                effect_func:function(total_dice_points:number) {
                    let val = Util.random_int(1, total_dice_points-1)
                    return SpellFuncs.give_dices(val, val) + SpellFuncs.give_dices(total_dice_points-val, total_dice_points-val, 0.5)
                },
                avaliable_count:1,
                max_limit:6,
            },
            {
                name:'轻顶',
                slot_desc:'最大\n{max_limit}',
                max_limit:5,
                slot_count:1,
                desc:'骰子点数+1',
                damage_func:function(total_dice_points) {
                    return total_dice_points
                },
                effect_func:function(total_dice_points:number) {
                    return SpellFuncs.give_dices(total_dice_points+1, total_dice_points+1)
                },
                avaliable_count:1
            }
        ]
    }
}