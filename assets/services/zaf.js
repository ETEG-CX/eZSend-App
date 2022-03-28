class ZafService{

    _appSize;
    _clientRef;
    _settingsRef;
    _contextRef;

    getClient(){
        const Client = this._clientRef;
        return Client
    }

    getSettings(){
        const Settings = this._settingsRef;
        return Settings
    }

    getContext(){
        const Context = this._contextRef;
        return Context
    }

    getAppSize(){
        const ClientSize = this._appSize;
        return ClientSize
    }

    setAppSize(size){
        this._appSize = size;
        this._clientRef.invoke("resize", { height: this._appSize });
    }

    setMessage(message, type = "success", reload = false, time = 6000){

        this._clientRef.invoke(
            "notify",
            message,
            type,
            time
        );

        if(reload){
            this.reloadApp();
        }
    }

    reloadApp(){
        location.reload();
    }

    filterTemplates(TemplateList, onlyActives = false){
        let filteredTemplates = TemplateList;

        if(onlyActives){
            filteredTemplates = TemplateList.filter((template) => {
                return template.status == "APPROVED";
            });
        }

        if (filteredTemplates.length) {
            if (this._settingsRef.include_only) {

                const Templates = [];

                const Filters = this._settingsRef.include_only.split(";");

                //Filtra todos os Elementos
                Filters.forEach((filter) => {
                    Templates.push(
                        ...filteredTemplates.filter((template) => {
                            return template['name'].includes(filter);
                        })
                    );
                });

                //Exclui entradas repetidas
                filteredTemplates = Templates.filter((template, index) => {
                    return Templates.indexOf(template) === index;
                });
            }

            if (this._settingsRef.exclude_all) {
                const TemplatesToExclude = [];
                const ExcludeFilters = this._settingsRef.exclude_all.split(";");

                //Filtra todos os Elementos
                ExcludeFilters.forEach((filter) => {
                    filteredTemplates.forEach((template) => {
                        if (template['name'].includes(filter)) {
                            TemplatesToExclude.push(template);
                        }
                    });
                });

                //Exclui os Elementos encontrados
                TemplatesToExclude.forEach((template) => {
                const IndexToExclude = filteredTemplates.indexOf(template);
                    filteredTemplates.splice(IndexToExclude, 1);
                });
            }

        }

        return filteredTemplates
    }

    //Start the client and get the settings
    async setupClient(){

        // Start client and resize app
        this._initClient();
                
        // Get settings parameters
        await this._getClientSettings();
                
        // Get app context
        const Context = await this._clientRef.context("context");

        this._contextRef = Context;
    }
    
    _initClient(){

        const NewClient = ZAFClient.init();

        NewClient.on("app.registered", (e) => {
            NewClient.invoke("resize", { width: "100%", height: "100%" });

            // Resize app according to it's height
            let appDiv = document.getElementById("app");
            this._appSize = appDiv.offsetHeight + 80;
            NewClient.invoke("resize", { height: this._appSize });
        });

        this._clientRef = NewClient;
        
        return NewClient
    }

    async _getClientSettings(){
        
        const Metadata = await this._clientRef.metadata();

        const ClientSettings = Metadata.settings;

        this._settingsRef = ClientSettings;

        return ClientSettings
    }
}