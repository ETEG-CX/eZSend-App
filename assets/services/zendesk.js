class ZendeskService {

    _agentRef;
    _userRef;
    _userPhoneRef;

    constructor( zafService ){
        this._zafService = zafService;
    }

    getAgent(){
        const Agent = this._agentRef;
        return Agent
    }

    getUser(){
        const User = this._userRef;
        return User
    }

    getUserPhone(){
        const UserPhone = this._userPhoneRef;
        return UserPhone
    }

    async iniZendeskService(){

        const Client = this._zafService.getClient();
        const Context = this._zafService.getContext();

        const Agent = await Client.get("currentUser");
        this._agentRef = Agent["currentUser"];

        if (Context.location == "user_sidebar") {
            const User = await Client.get("user");
            this._userRef = User["user"];
        }
        else if (Context.location == "ticket_sidebar") {
            const User = await Client.get("ticket.requester");
            this._userRef = User["ticket.requester"];
        }
        else{
            this._zafService.setMessage('Falha ao recuperar o id do usuário', 'error');
        }

        const ZendeskUser = await this._getZendeskUser(this._userRef['id']);

        if(ZendeskUser){
            if(ZendeskUser.phone){
                this._userPhoneRef = ZendeskUser.phone;
            }
            else if(ZendeskUser.user_fields.whatsapp){
                this._userPhoneRef = ZendeskUser.user_fields.whatsapp;
            }
        }

        if (this._userPhoneRef && this._userPhoneRef < 12) {
            this._userPhoneRef = null;
            this._zafService.setMessage('O número cadastrado é invalido', 'error');
        }

    }

    async _getZendeskUser(userId){

        const settingsUserPayload = {
            url: `/api/v2/users/${userId}.json`,
            type: "GET",
            contentType: "application/json",
            dataType: "json",
            crossDomain: false,
            cors: false,
            cache: false,
        };

        const Response = await this._getZendeskUserApiCall(settingsUserPayload);
        return Response
    }

    async _getZendeskUserApiCall(payload){
        try{
            const ClientRef = this._zafService.getClient();
            const Respose = await ClientRef.request(payload);
            return Respose['user']
        }
        catch(err){
            this._zafService.setMessage('Falha ao carregar o usuário Zendesk', 'error');
        }
    }
}