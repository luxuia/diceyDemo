// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

interface IModel {
    [key : string]:string;
}

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';



    model:IModel = {
        panel: 'panel'
    }

    RoleModel:IModel = {
        name:'Name',
        career:'Career',
        HP:'HP',
    }
 
    handler = {}

    test = {
        a:function()
        {
            cc.log('asd');
            return 'a'
        }
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        for (var i=1;i < 4; i++) {
            this.RoleModel['dices' + i] = 'Dices/Dice' + i; 
        }
        Object.keys(this.RoleModel).forEach(key=>{
            this.handler[key] = this.RoleModel[key]
        })

    }

    update(dt:number) {

    }
    

    // update (dt) {}
}
