
export default class Util {
    static parse_model(node:cc.Node, parent:string, model:IModel) {
        let handler:IModelNode = {}
        Object.keys(model).forEach(key=>{
            handler[key] = cc.find((parent? parent + '/':'') + model[key], node)
        })
        handler['self'] = parent?cc.find(parent, node):node
        return handler
    }

    static random_int(min:number, max:number){
        return Math.floor(Math.random()*(max-min+1))+min
    }
}