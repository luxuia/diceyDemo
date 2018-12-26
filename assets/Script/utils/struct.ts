
interface IModel {
    [key : string]:string;
}

interface IModelNode {
    [key: string]:cc.Node
    //self node is always exist
}

interface IDiceNode {
    node_handler:IModelNode

    index:number
    point:number
    alive:boolean
}

interface ISpellDamageFunc {
    (total_point:number, ...args:any[]):number
}

// config data // 
interface ISpell {
    name:string
    desc:string
    slot_count:number
    slot_desc:string
    
    damage_func:ISpellDamageFunc
    effect_func?:ISpellDamageFunc

    avaliable_count:number
    max_limit:number
    show_name?:string
}

/**
 * TODO class
 */
interface ISpellNode {
    node_handler:IModelNode
    spell_cfg?:ISpell
    avaliable_count:number
    alive:boolean
    dices?:IDiceNode[]
    index:number
    total_point:number

    __pooled:boolean
}

interface IRoleCfg{
    // config
    dice_count:number
    spells:Array<ISpell>
    hp:number
    name:string
    show_name?:string
    // end config
}

enum BattleSide {
    Player,     // 左下
    Enemy       // 右上
}

interface IRole extends IRoleCfg {
    max_hp?: number
    spell_nodes?:ISpellNode[] // 技能ui
    dice_nodes?:IDiceNode[] // 骰子ui
    role_nodes?:IModelNode // 角色信息ui
    side?:BattleSide 
}