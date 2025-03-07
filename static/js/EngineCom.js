class EngineCom {
    constructor(loadingOverlay, messageHandler) {
        this.loadingOverlay = loadingOverlay;
        this.messageHandler = messageHandler;
    }

    async initiateGame(players, deck){
        const initStruct = `structure S : V_final {
            Time = {0..1}
            Player = { 1..` + players + ` }\n    ` + deck + `\n}`;

        let rdata = await this.callIDP('init', initStruct);

        return rdata;
    }

    async progressGame(structure){
        const stepStruct = structure.replace(": V_final_ss", "S : Vss").replaceAll("[ : Prop]", "[ : Prop]()");

        let rdata = await this.callIDP('oneStepProgress', stepStruct);
       
        return rdata;
    }

    async callIDP(inference, structure){
        const url = `http://localhost:8000/ltc_progress?structure=${encodeURIComponent(structure)}&inference=${inference}`;
        
        let status;
        let rdata;
        this.loadingOverlay.style.visibility = "visible";
        await fetch(url)
            .then(response => response.json())
            .then(data => {
                status = data.value;
                if(status == "success"){
                    rdata = this.#extractStructureBlock(data.msg);
                }else{
                    rdata = data.msg;
                }
            })
            .catch(error => {
                this.messageHandler.setTheConsole("Error executing an IDP request '" + inference + "': " + error, true);
            })
            .finally(() => {
                this.messageHandler.setTheConsole("IDP request '" + inference + "' executed successfully!", false);
                this.loadingOverlay.style.visibility = "hidden";
            });

        return {status: status, data: rdata};
    }

    #extractStructureBlock(input) {
        const startMarker = "structure  : V_final_ss {";
        const startIndex = input.indexOf(startMarker);
    
        if (startIndex === -1) {
            return null; // Not found
        }
    
        let openBraces = 0;
        let endIndex = startIndex;
    
        for (let i = startIndex + startMarker.length - 1; i < input.length; i++) {
            if (input[i] === "{") openBraces++;
            if (input[i] === "}") openBraces--;
    
            endIndex = i;
            
            if (openBraces === 0) {
                break;
            }
        }
    
        return input.substring(startIndex, endIndex + 1); // Extract full block
    }



}

export default EngineCom;