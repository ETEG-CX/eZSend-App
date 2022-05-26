class SuncoService {

    _zafServiceRef;

    constructor( zafService ){
        this._zafServiceRef = zafService;
    }

    async getAllTemplates(){

        const AppSettings = this._zafServiceRef.getSettings();

        // Set templates payload request settings
        const settingsTemplatesPayload = {
            url: `https://api.smooch.io/v1.1/apps/${AppSettings.app_id}/integrations/${AppSettings.integration_id}/messageTemplates?limit=1000`,
            type: "GET",
            contentType: "application/json",
            dataType: "json",
            headers: {
                Authorization: `Basic ${AppSettings.api_token}`,
            },
            crossDomain: true,
            cors: false,
        };

        const Response = await this._getAllTemplatesApiCall(settingsTemplatesPayload);

        return Response
    }

    async deleteTemplateByName(templateName){

        const AppSettings = this._zafServiceRef.getSettings();

        const settingsDeleteTemplate = {
            url: `https://api.smooch.io/v1.1/apps/${AppSettings.app_id}/integrations/${AppSettings.integration_id}/messageTemplates/${templateName}`,
            httpCompleteResponse: true,
            type: "DELETE",
            contentType: "application/json",
            dataType: "json",
            headers: {
                Authorization: `Basic ${AppSettings.api_token}`,
            },
            crossDomain: true,
            cors: false,
        };

        const Response = await this._deleteTemplateApiCall(settingsDeleteTemplate, templateName);
        return Response
    }

    async sendNotification(userId, userPhone, agentId, templateName, templateCategory,TemplateLanguage, templateParams){

        const AppSettings = this._zafServiceRef.getSettings();

        const HasUrlParams = AppSettings.chat_avatar.split('?').length;
     
        const SuncoParams = {
            userId: userId,
            agendId: agentId,
            switchboardIntegration: AppSettings.switchboard_integration_name,
            createTicket: AppSettings.enable_notifications_ticket_registration,
            ticketTitle: AppSettings.ticket_subject,
            templateName: templateName,
            templateCategory: templateCategory,
            ticketTag:AppSettings.tag
        };

        let queryConnector;

        if(!HasUrlParams){
            queryConnector = "?suncoParams=";
        }
        else{
            queryConnector = "&suncoParams=";
        }

        const Base64Params = btoa(JSON.stringify(SuncoParams));

        const AvatarUrl = `${AppSettings.chat_avatar}${queryConnector}${Base64Params}`;

        const RequestComponents = [
            {
              type: "body",
              parameters: templateParams,
            },
        ]

        const Data = {
            destination: {
                integrationId: AppSettings.integration_id,
                destinationId: userPhone
              },
              author: {
                role: 'appMaker',
                name: AppSettings.chat_nickname,
                avatarUrl: AvatarUrl
              },
              messageSchema: 'whatsapp',
              message: {
                type: 'template',
                template: {
                  namespace: AppSettings.whatsapp_namespace,
                  name: templateName,
                  language: {
                    policy: 'deterministic',
                    code: TemplateLanguage,
                  },
                  components: RequestComponents,
                },
              },
        }

        const settingsSendNotification = {
            url: `https://api.smooch.io/v1.1/apps/${AppSettings.app_id}/notifications`,
            httpCompleteResponse: true,
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            headers: {
                Authorization: `Basic ${AppSettings.api_token}`,
            },
            data: JSON.stringify(Data),
            crossDomain: true,
            cors: false,
        };

        const Response = await this._sendNotificationApiCall(settingsSendNotification);
        return Response
    }

    async _getAllTemplatesApiCall(payload){
        try{
            const ClientRef = this._zafServiceRef.getClient();
            const Respose = await ClientRef.request(payload);
            return Respose['messageTemplates']
        }
        catch(err){
            this._zafServiceRef.setMessage('Falha ao carregar templates', 'error', true);
        }
    }

    async _deleteTemplateApiCall(payload, templateName){
        try{
            const ClientRef = this._zafServiceRef.getClient();
            const Respose = await ClientRef.request(payload);
            this._zafServiceRef.setMessage(`Template ${templateName} deletado com sucesso`);
            return Respose
        }
        catch(err){
            this._zafServiceRef.setMessage(`Falha ao deletar o template ${templateName}`, 'error');
        }
    }

    async _sendNotificationApiCall(payload){
        try{
            const ClientRef = this._zafServiceRef.getClient();
            const Respose = await ClientRef.request(payload);
            this._zafServiceRef.setMessage(`Notificação enviada com sucesso`);
            return Respose
        }
        catch(err){
            this._zafServiceRef.setMessage(`Falha ao enviar a notificação`, 'error');
        }
    }



}