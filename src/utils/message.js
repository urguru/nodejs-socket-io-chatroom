const generateMessage=(text)=>{
    return{
        text,
        createdAt: new Date()
    }
}

module.exports={
    generateMessage
}