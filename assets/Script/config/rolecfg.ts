
export default class RoleCfg {
    static warrier:IRoleCfg = {
        name:"战士",
        dice_count: 2,        
        hp:24,
        spells : [
            {
                name:'剑',
                desc:'造成<img src=""/>{total_dice_points}点伤害',
                slot_count:1,
                slot_desc:'最大\n{max_limit}',
                max_limit:5,
                damage_func:function(total_dice_points) {
                    return total_dice_points
                }
            },
            {
                name:'投掷',
                desc:'重新投出一个骰子\n(本回合可使用{avaliable_count}次)',
                slot_count:1,
                slot_desc:'',
                avaliable_count:3,
                damage_func:function(total_dice_points) {
                    return total_dice_points
                }
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
                avaliable_count:Number.MAX_VALUE,
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
                    return total_dice_points
                }
            },
            {
                name:'轻顶',
                slot_desc:'最大\n{max_limit}',
                max_limit:5,
                slot_count:1,
                desc:'骰子点数+1',
                damage_func:function(total_dice_points) {
                    return total_dice_points
                }
            }
        ]
    }
}