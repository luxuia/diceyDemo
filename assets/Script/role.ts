import './utils/struct'
import BattleMain from './battle'
import Util from './utils/util'

enum BattleSide {
    Player,     // 左下
    Enemy       // 右上
}

export default class Role {
    max_hp:number
    hp:number
    dice_count:number
    name:string

    cfg:IRoleCfg

    spell_nodes:ISpellNode[] // 技能ui
    dice_nodes:IDiceNode[] // 骰子ui
    role_nodes:IModelNode // 角色信息ui
    side:BattleSide

    dice_node_pool:IDiceNode[]

    static RoleModel:IModel = {
        name:'Name',
        career:'Career',
        hp_progress:'HP',
        hp_num:'HP/num',
        dice_root:'Dices',
    }

    ease_from_y:number

    static total_dice_cache_count=6

    dice_init_pos:cc.Vec2[] = []

    constructor(cfg:IRoleCfg) {
        this.hp = cfg.hp
        this.max_hp = cfg.hp
        this.dice_count = cfg.dice_count
        this.cfg = cfg
        this.name = cfg.name
    }
    
    parse_role_ui(role_tag:string, parent_node:cc.Node, ease_from:number) {

        this.ease_from_y = ease_from

        //let handler:ModelNode = {}
        let idx = 0.1
        let handler = Util.parse_model(parent_node, role_tag, Role.RoleModel)
        Object.keys(Role.RoleModel).forEach(key=>{
            let node = handler[key]
            let old_x = node.x
            let old_y = node.y
            node.setPosition(old_x, ease_from)
            BattleMain.instance.scheduleOnce(function(){

                let action = cc.moveTo(1, old_x, old_y)
                action.easing(cc.easeInOut(3))
                node.runAction(action)
            }, idx)
            idx+=0.1
        })

        let dices_model = {}
        for (let i=1;i<=Role.total_dice_cache_count;i++) {
            dices_model['dices' +i] = 'Dices/Dice'+i
        }

        let dice_handler = Util.parse_model(parent_node, role_tag, dices_model)

        this.dice_nodes = []
        this.dice_node_pool = []

        for (let i=1; i<= Role.total_dice_cache_count; ++i) {
            let key = 'dices' + i

            let node = dice_handler[key]

            this.dice_init_pos.push(node.getPosition())

            this.push_free_dice(node, i)

            node.on(cc.Node.EventType.TOUCH_START, function(event){
                node.opacity = 100
                cc.log('touch begin ', key)
            })
            let self = this
            node.on(cc.Node.EventType.TOUCH_END, function(event:cc.Event.EventTouch){
                node.opacity = 255

                cc.log('touch end ', key)

                for (let key in self.spell_nodes) {
                    if (self.spell_nodes[key] && self.spell_nodes[key].alive) {
                        let element = self.spell_nodes[key].node_handler

                        let bg_com = element.bg1.getComponent(cc.Sprite)
                        if (element.bg1.getBoundingBoxToWorld().contains(event.getLocation())){
                            cc.log("touch in spell card", key)

                            self.try_use_spell(self.spell_nodes[key], self.dice_nodes[i-1])
                            break
                        }
                    }
                };
            })
            node.on(cc.Node.EventType.TOUCH_MOVE, function(event:cc.Event.EventTouch){
                let delta = event.getDelta()
                node.x += delta.x
                node.y += delta.y
            })
        }
        this.role_nodes = handler

        this.refresh_role_info()
    }

    refresh_role_info() {
        let handler = this.role_nodes
        handler.hp_num.getComponent(cc.Label).string = `${this.hp}/${this.max_hp}`
        handler.hp_progress.getComponent(cc.ProgressBar).progress = this.hp/this.max_hp
        handler.name.getComponent(cc.Label).string = this.name
        handler.career.getComponent(cc.Label).string = ''
    }

    do_damage_effect(damage:number) {
        let role = BattleMain.instance.get_defender()
        role.hp = role.hp - damage

        role.refresh_role_info()
    }

    show_spell_card() {
        let battle_main = BattleMain.instance

        let spells = this.cfg.spells
        for (let i=0;i<spells.length;++i) {
            let target_pos = battle_main.get_spell_pos(spells[i], i)
            // 保证卡的显示层级
            let node = battle_main.pop_spell_card()

            this.spell_nodes.push(node)

            let handler = node.node_handler

            let spell_cfg = spells[i]
            node.spell_cfg = spell_cfg
            node.dices = []
            node.alive = true
            node.avaliable_count = spell_cfg.avaliable_count ? spell_cfg.avaliable_count : 1
            node.index = i
            
            let width = cc.winSize.width+100
            let targetx = target_pos.x
            let targety = target_pos.y
            handler.self.setPosition(width, targety)

            battle_main.scheduleOnce(function(){
                let action = cc.moveTo(1, targetx, targety)
                action.easing(cc.easeInOut(3))
                handler.self.runAction(action)
            }, (spells.length- i)*0.3+0.3)

            handler.name.getComponent(cc.Label).string = spell_cfg.name
            handler.desc.getComponent(cc.RichText).string = spell_cfg.desc.replace(/{(\w+)}/g, function(match, sub, sub2){
                return BattleMain.replace_desc_func(spell_cfg, match, sub, sub2)
            })
            handler.slot_desc.getComponent(cc.Label).string = spell_cfg.slot_desc.replace(/{(\w+)}/g, function(match, sub, sub2){
                return BattleMain.replace_desc_func(spell_cfg, match, sub, sub2)
            })
        }
    }

    /**
     * 
     * @param spellcfg 
     * @param index 
     * @param avaliable_count 
     * 产生一个技能卡片的副本，当卡片可用次数大于0的时候出现
     */
    create_background_spell_card(spellcfg:ISpell, index:number, avaliable_count:number) {
        let target_pos = BattleMain.instance.get_spell_pos(spellcfg, index)
        // 保证卡的显示层级
        let node = BattleMain.instance.pop_spell_card()

        this.spell_nodes[index] = node

        let handler = node.node_handler

        node.spell_cfg = spellcfg
        node.dices = []
        node.alive = true
        node.avaliable_count = avaliable_count
        
        handler.self.setPosition(target_pos)
    }

    try_use_spell(spell:ISpellNode, dice:IDiceNode) {
        //check can add this dice
        let cfg = spell.spell_cfg

        cc.log(`try use spell ${cfg.name} with dice point ${dice.point}`)

        // 需要骰子，已有骰子数量小于需要的
        if (cfg.slot_count <= 0 && spell.dices.length >= cfg.slot_count) return 0.2
        // 骰子点数大于最大值
        if (cfg.max_limit && cfg.max_limit < dice.point) return 0.2
        
        spell.dices.push(dice)
        
        // 把骰子放到卡片对应的槽上
        let slot_pos = spell.node_handler.slot.convertToWorldSpaceAR(cc.Vec2.ZERO)
        let dice_root = this.role_nodes.dice_root
        let node_space_pos = dice_root.convertToNodeSpaceAR(slot_pos)

        let dis = Math.max(Math.min(node_space_pos.sub(slot_pos).mag()/50, 5), 1)
        let tween_time = dis*0.2
        let dice_action = cc.moveTo(tween_time, node_space_pos)
        dice_action.easing(cc.easeInOut(5))
        let dice_node = dice.node_handler.self
        dice_node.runAction(dice_action)

        // 骰子数量不够
        if (cfg.slot_count > spell.dices.length) return tween_time

        let self = this
        // 技能無效
        spell.avaliable_count--
        if (spell.avaliable_count <= 0)
            spell.alive = false
        else {
            this.create_background_spell_card(spell.spell_cfg, spell.index, spell.avaliable_count)
        }
        
        // 骰子無效
        spell.dices.forEach(dice=>dice.alive=false)

        //伤害计算
        BattleMain.instance.scheduleOnce(function(){
            dice_node.stopAction(dice_action)
            let total_point = 0
            for (let i=0; i < spell.dices.length;++i) {
                total_point+=spell.dices[i].point
            }
            cc.log( spell.dices )
            let damage = cfg.damage_func(total_point)

            cc.log(`cast spell ${cfg.name} casuse damage ${damage}, total dice point ${total_point}`)

            self.do_damage_effect(damage)

            // 移除动画的方向
            let targety:number
            let dice_targety:number
            let card_height = 100 //TODO calc card height

            //自己攻击或者 敌人治疗
            if (damage > 0 && BattleMain.instance.battle_turn == BattleSide.Player
                || damage < 0 && BattleMain.instance.battle_turn == BattleSide.Enemy) {
                // attack other
                targety = cc.winSize.height/2+card_height
                dice_targety = cc.winSize.height+card_height

            } else {
                // recover me
                targety = -cc.winSize.height/2-card_height
                dice_targety = -cc.winSize.height-card_height
            }
            

            // 移除技能卡片动画
            let remove_card_time = 0.5
            let old_x = spell.node_handler.self.x
            let action = cc.moveTo(remove_card_time, old_x, targety)
            action.easing(cc.easeInOut(3))
            spell.node_handler.self.runAction(action)

            setTimeout(() => {
                // 回收卡片
                BattleMain.instance.push_spell_card(spell)
            }, remove_card_time);

            //移除骰子动画            
            old_x = dice_node.x
            let old_y = dice_node.y
            let dice_local = dice_root.convertToNodeSpaceAR(new cc.Vec2(0, dice_targety))
            let node_action = cc.moveTo(0.5, old_x, dice_local.y)
            node_action.easing(cc.easeInOut(3))
            dice_node.runAction(node_action)
            
            if (spell.spell_cfg.effect_func) {
                setTimeout(() => {
                    spell.spell_cfg.effect_func(total_point)
                }, remove_card_time);
             }
        }, tween_time)
        
        return tween_time + 0.5
    }

    show_dices() {
        let dices = this.dice_nodes
        
        let dice_count = this.dice_count

        let ease_from = this.ease_from_y
        let idx = 0.1
        for (let key=0;key<dice_count; key ++){
            let dice = this.pop_free_dice()
            dices[key] = dice

            let node = dice.node_handler.self

            let dice_point = Util.random_int(1, 6)
            dice.index = key
            this.show_dice(dice, dice_point, idx)

            idx+=0.1
        }
    }

    show_dice(dice:IDiceNode, point:number, delay:number) {
            let node = dice.node_handler.self
            dice.point = point

            let self = this
            cc.loader.loadRes('Texture/dice', cc.SpriteAtlas, function(err, atlas:cc.SpriteAtlas){
                let frame = atlas.getSpriteFrame('dice' + point)
                node.getComponent(cc.Sprite).spriteFrame = frame
            })

            let old_x = node.x
            let old_y = node.y
            node.setPosition(old_x, self.ease_from_y)
            BattleMain.instance.scheduleOnce(function(){

                let action = cc.moveTo(1, old_x, old_y)
                action.easing(cc.easeInOut(3))
                node.runAction(action)
            }, delay)
    }

    pop_free_dice() {
        let dice:IDiceNode
        for (let i=0;i<Role.total_dice_cache_count;++i) {
            if (this.dice_node_pool [i]) {
                dice = this.dice_node_pool [i]
                this.dice_node_pool[i] = null
                break
            }
        }
        dice.node_handler.self.active = true
        dice.node_handler.self.setPosition(this.dice_init_pos[dice.index])
        dice.alive = true
        this.dice_nodes[dice.index] = dice

        return dice
    }

    push_free_dice(node:cc.Node|IDiceNode, idx?:number) {
        if ((<IDiceNode>node).point) {
            this.dice_node_pool[idx] = <IDiceNode>node
        } else {
            this.dice_node_pool[idx] = {node_handler:{self:<cc.Node>node}, index:idx, point:0, alive:false}
        }
        this.dice_node_pool[idx].node_handler.self.active = false
        this.dice_node_pool[idx].alive = false
    }

    give_dice(point:number, delay:number) {
        let dice = this.pop_free_dice()

        this.show_dice(dice, point, delay)
    }

    clean_dices() {
        for (let i =0; i < this.dice_nodes.length;++i) {
            this.push_free_dice(this.dice_nodes[i])
        }
        this.dice_nodes = []
    }

    clean_spell_cards() {
        for (let i=0;i<this.spell_nodes.length;++i) {
            BattleMain.instance.push_spell_card(this.spell_nodes[i])
        }
        this.spell_nodes = []
    }

    on_attack_start(){
        cc.log('on_attack_start ', this.name)

        // show spells
        this.show_spell_card()

        //show dices
        this.show_dices()
    }

    on_attack_end(){
        cc.log('on_attack_end ', this.name)

        this.clean_dices()

        this.clean_spell_cards()
    }
}