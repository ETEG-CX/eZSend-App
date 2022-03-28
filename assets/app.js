let zafService;
let suncoService;
let zendeskService;

const Colors = {
    Red: '#cc3340',
    Green: '#038153',
    Gray: '#333333'
}

window.onload = async function() {

    await _initServices()

    const Context = zafService.getContext();

    if (Context['product'] === "support") {
        _initApp();
    } 
    else {
        this.setMessage('Erro ao carregar aplicativo', 'error')
    }
}

async function _initServices(){
    zafService = new ZafService();
    await zafService.setupClient();

    suncoService = new SuncoService(zafService);

    zendeskService = new ZendeskService(zafService);
    await zendeskService.iniZendeskService()
}


async function _initApp(){

    // Get agent role
    const Agent = zendeskService.getAgent();

    if (Agent.role === "admin") {
        const ActionButtonsRef = document.getElementById("actionButtons");
        //ActionButtonsRef.style.display= 'flex' ;  
    }

    const UserPhone = zendeskService.getUserPhone();
    const MissingWhatsappNumberRef = document.getElementById("missingWhatsappNumber");
    const MessagesTemplates = document.getElementById("messageTemplateInput");
    const FoundWhatsappNumberRef = document.getElementById("foundWhatsappNumber");

    if(!UserPhone){

        MissingWhatsappNumberRef.hidden = false;
        MessagesTemplates.hidden = true;
        FoundWhatsappNumberRef.parentElement.hidden = true;
    
        const AppDiv = _getAppDiv();
        const AppSize = AppDiv.offsetHeight;
        zafService.setAppSize(AppSize);
    }
    else{

        FoundWhatsappNumberRef.innerHTML = UserPhone;
        loadTemplates();
    }
}

async function loadTemplates(){
    const Templates = await suncoService.getAllTemplates();

    const FilteredTemplates = zafService.filterTemplates(Templates, true);

    const Datalist = document.getElementById("messagesTemplates");
    const Input = document.getElementById("messageTemplateInput");

    const Options = _setOptions(FilteredTemplates);

    Datalist.innerHTML = Options;

    ["keyup", "change"].forEach((event) => {
        Input.addEventListener(event, () => {
            const AppDiv = _getAppDiv();
            const InputValue = Input.value;
            const TemplateNameRef = document.getElementById("templateName");
            const TemplateCategoryRef = document.getElementById("templateCategory");
            const TemplateBodyRef = document.getElementById("templateBody");
            const ShowTemplateRef = document.getElementById("showTemplate");
            const SendButtonRef = document.getElementById("sendButton");
            const ParametersRef = document.getElementById("parameters");
            const ParametersInputsRef = document.getElementById("parametersInputs");

            const SelectedOption = Array.from(Datalist.options).filter((option) => {
                return option.text === InputValue;
            });
    
            if (!SelectedOption.length) {
                showTemplate.hidden = true;
                sendButton.hidden = true;
                return;
            }
    
            const SelectedTemplate = FilteredTemplates.filter((template) => {
                return template.name == SelectedOption[0].text
            });
    
            const ComponentBody = SelectedTemplate[0].components.filter((component) => {
                return component.type == "BODY"
            });
    
            // Insert approved message tepmlates into HTML
            ShowTemplateRef.hidden = false;
            SendButtonRef.hidden = false;
            TemplateNameRef.innerHTML = SelectedTemplate[0].name;
            TemplateCategoryRef.innerHTML = SelectedTemplate[0].category;
            TemplateBodyRef.innerHTML = ComponentBody[0].text;
    
            //reset parameters fields
            if(!ParametersRef.hidden){
                const ParametersArrayRef = [].slice.call(ParametersInputsRef.getElementsByTagName('input'),0);
        
                ParametersArrayRef.forEach(parameter => {
                    ParametersInputsRef.removeChild(parameter);
                })
            }


            // Verify if template has parameters and if true show parameters HTML div
            const ParamsCount = ComponentBody[0].text.match(new RegExp("{{", "g"))?.length;

            if(ParamsCount > 0){

                ParametersRef.hidden = false;  
                ParametersInputsRef.innerHTML = "";
                _insertParamsInput(ParamsCount, ParametersInputsRef);

            }
    
            // Resize app according to it's height
            const AppSize = AppDiv.offsetHeight + 60;
            zafService.setAppSize(AppSize);
        });
    });
}

function _insertParamsInput(paramsCount, parametersInputsRef){
    const Label = document.createElement("label");

    Label.innerHTML = "Esta notificação possui parâmetros, os insira em suas respectivas caixas:";
  
    parametersInputsRef.appendChild(Label);
  
    for (let i = 1; i <= paramsCount; i++) {

      const Input = document.createElement("input");
      Input.type = "text";
      Input.id = `inputParameters${i}`;
      Input.name = `inputParameters${i}`;
      Input.className = `inputParameters`;
      Input.placeholder = `Parâmetro {{${i}}}`;
  
      parametersInputsRef.appendChild(Input);
    }

};

async function sendNotification(){
    const ParametersRef = document.getElementById("parameters");
    const ParametersInputsRef = document.getElementById("parametersInputs");
    const TemplateNameRef = document.getElementById("templateName");
    const TemplateCategoryRef = document.getElementById("templateCategory");
    const ButtonRef = document.getElementById("sendButton");
    const TemplateParams = [];

    if(!ParametersRef.hidden){
        const ParametersArrayRef = [].slice.call(ParametersInputsRef.getElementsByTagName('input'),0);
        let validParameters = true;

        ParametersArrayRef.forEach(parameter => {
            if(!parameter.value){
                validParameters = false; 
                return
            }

            const CurrentParam = {
                type: 'text',
                text: parameter.value
            }

            TemplateParams.push(CurrentParam);
        })

        if(!validParameters){
            zafService.setMessage(`Preencha todos os parametros antes de enviar`, 'error');
            return
        }
    }

    const UserId = zendeskService.getUser()['id'];
    const UserPhone = zendeskService.getUserPhone();
    const AgentId = zendeskService.getAgent()['id'];
    const TemplateName = TemplateNameRef.innerHTML;
    const TemplateCategory = TemplateCategoryRef.innerHTML;

    _SetLoadding(ButtonRef, true);
    const Response = await suncoService.sendNotification(UserId, UserPhone, AgentId, TemplateName, TemplateCategory, TemplateParams);
    _SetLoadding(ButtonRef, false);
    if(Response){
        zafService.reloadApp()
    }
}

function createTemplate(){

    const AppSettings = zafService.getSettings();

    const AppDiv = _getAppDiv();

    AppDiv.innerHTML = `
        <div id="createTemplateForm">

            <h2>
                Criação de templates via Zendesk App ainda não está disponível.
            </h2>

            <p>
                Para criar um template, 

                <a 
                    href="https://app.smooch.io/login"
                    target="_blank"
                >

                    <b>
                        faça login em sua conta Sunshine Conversations
                    </b>

                </a> 

                e acesse a página de

                <a 
                    href="https://app.smooch.io/apps/${AppSettings.app_id}/channels/${AppSettings.integration_id}"
                    target="_blank"
                >

                    <b>
                        criação de templates
                    </b>

                </a>.

            </p>

        </div>

        <input
            type="button"
            id="returnToHome"
            value="Voltar"
            style="float: left;"
            onclick="location.reload()"
        />
    `;

    const AppSize = AppDiv.offsetHeight + 45;
    zafService.setAppSize(AppSize);
};

async function deleteTemplate(){

    const AppDiv = _getAppDiv();

    AppDiv.innerHTML = `
        <div id="deleteTemplateForm" style="min-height: 200px">

            <form id="">

                <h2>
                    Formulário para Deletar Templates:
                </h2>

                <div id="aboutWhatsappNumber">

                    <div id="missingWhatsappNumber">

                        <h2>
                            Atenção! Após clicar no botão para deletar o template selecionado, essa ação não poderá ser revertida.
                        </h2>

                    </div>

                    <input 
                        id="messageTemplateInputDelete"
                        list="messagesTemplatesDelete"
                        placeholder="Selecione o template..."
                        style="width: 100%; margin-bottom: 15px"
                    >

                    <datalist id="messagesTemplatesDelete">
                    </datalist>


                    <input
                        type="button"
                        id="returnToHome"
                        value="Voltar"
                        style="float: left; cursor:pointer"
                        onclick="location.reload()"
                    >

                    <div id="showTemplate" hidden>

                        <table>
                            <tr>
                                <th>Status:</th>
                                <td id="templateStatus"></td>
                            </tr>
                            <tr>
                                <th>Template:</th>
                                <td id="templateName"></td>
                            </tr>
                            <tr>
                                <th>Categoria:</th>
                                <td id="templateCategory"></td>
                            </tr>
                            <tr>
                                <th>Mensagem:</th>
                                <td id="templateBody"></td>
                            </tr>
                        </table>

                        <div id="deleteTemplateConfirmation">

                            <b>Confirme o nome do template a ser apagado:</b>

                            <div id="deleteConfirmationInput">
                                <input
                                    type="text"
                                    id="confirmationDeleteTemplateText"
                                    name="confirmationDeleteTemplateText"
                                    placeholder="Digite o nome do template..."
                                />
                            </div>
                            
                        </div>

                        <input
                            type="button"
                            id="deleteTemplate"
                            value="Deletar Template"
                            onclick="handleDeleteTemplateClick()"
                        />
                        <span id="loadingSpan" hidden>
                            Aguarde
                            <img src="./loader.gif">
                        </span>

                    </div>

                </div>

            </form>

        </div>
    `;

    const AppSize = AppDiv.offsetHeight;
    zafService.setAppSize(AppSize);

    const Templates = await suncoService.getAllTemplates();

    const FilteredTemplates = zafService.filterTemplates(Templates);

    const Datalist = document.getElementById("messagesTemplatesDelete");
    const Input = document.getElementById("messageTemplateInputDelete");

    const Options = _setOptions(FilteredTemplates);

    Datalist.innerHTML = Options;

    ["keyup", "change"].forEach((event) => {
        Input.addEventListener(event, () => {
            const InputValue = Input.value;
            const SelectedOption = Array.from(Datalist.options).filter(option => option.text === InputValue);
            const TemplateStatusRef = document.getElementById("templateStatus");
            const TemplateNameRef = document.getElementById("templateName");
            const TemplateCategoryRef = document.getElementById("templateCategory");
            const TemplateBodyRef = document.getElementById("templateBody");
            const ShowTemplateRef = document.getElementById("showTemplate");
            document.getElementById("confirmationDeleteTemplateText").value = null;


            if (!SelectedOption.length) {
                showTemplate.hidden = true;
                return
            }

            const SelectedTemplate = FilteredTemplates.filter((template) => {
                return template['name'] === SelectedOption[0].text
            });

            const ComponentBody = SelectedTemplate[0].components.filter(component => {
                return component.type === "BODY"
            });

            // Insert message template into HTML
            ShowTemplateRef.hidden = false;
            TemplateStatusRef.innerHTML = SelectedTemplate[0].status;

            if (SelectedTemplate[0].status == "REJECTED") {
                TemplateStatusRef.style.color = Colors.Red;
                TemplateStatusRef.style.fontWeight = "bold";
            } 
            else if (SelectedTemplate[0].status == "APPROVED") {
                TemplateStatusRef.style.color = Colors.Green;
                TemplateStatusRef.style.fontWeight = "bold";
            } 
            else if (SelectedTemplate[0].status == "PENDING") {
                TemplateStatusRef.style.color = Colors.Gray;
                TemplateStatusRef.style.fontWeight = "bold";
            }

            TemplateNameRef.innerHTML = SelectedTemplate[0].name;
            TemplateCategoryRef.innerHTML = SelectedTemplate[0].category;
            TemplateBodyRef.innerHTML = ComponentBody[0].text;

            // Resize app according to it's height
            const AppSize = AppDiv.offsetHeight + 60;
            zafService.setAppSize(AppSize);
        });
    });
};

async function handleDeleteTemplateClick(){
    const TargetTemplateName = document.getElementById("templateName").innerHTML;
    const ConfirmationInput = document.getElementById("confirmationDeleteTemplateText").value;
    const ButtonRef = document.getElementById("deleteTemplate");

    if(TargetTemplateName !== ConfirmationInput){
        zafService.setMessage(`Falha ao confirmar a exclusão do template ${TargetTemplateName}`, 'error');
        document.getElementById("confirmationDeleteTemplateText").value = null;
        return
    }

    _SetLoadding(ButtonRef, true);
    const Response = await suncoService.deleteTemplateByName(TargetTemplateName);
    _SetLoadding(ButtonRef, false);

    if(Response){
        zafService.reloadApp()
    }
}

async function downloadTemplateCSV(){

    const Templates = await suncoService.getAllTemplates();
    const FilteredTemplates = zafService.filterTemplates(Templates);
    const ButtonRef = document.getElementById("downloadTemplates");

    if(!FilteredTemplates.length){
        zafService.setMessage(`Não existem templates para serem exportados`, 'error');
        return
    }

    _SetLoadding(ButtonRef, true);

    const CSVRawData = [];

    const Header = 'name,category,header,body,footer,buttons,laguage,status'

    CSVRawData.push(Header)

    FilteredTemplates.forEach(template => {

        let templateData = "";

        Header.split(',').forEach(headerKey => {

            if(templateData){
                templateData += ','
            }

            if(headerKey !== 'header' && headerKey !== 'body'&& headerKey !== 'footer' && 'buttons'){
                if(template[headerKey]){
                    templateData += template[headerKey];
                }
            }
            else{
                templateData += _getTemplateComponentsForCSV(template['components'], headerKey)
            }
        })

        CSVRawData.push(templateData)
    })

    const CSVData = _prepareCSV(CSVRawData);

    const HiddenElement = document.createElement("a");
    HiddenElement.href = "data:text/csv;charset=utf-8,%EF%BB%BF" + encodeURI(CSVData);
    HiddenElement.target = "_blank";
    HiddenElement.download = "templates.csv";
    HiddenElement.click();
    HiddenElement.remove();

    _SetLoadding(ButtonRef, false);
}

function _getAppDiv(){
    const AppDiv = document.getElementById("app"); 
    return AppDiv
}

function _setOptions(filteredTemplates){
    const Options = [];

    for (let iterator in filteredTemplates) {
        let option = filteredTemplates[iterator];

        Options.push(`<option value="${option['name']}">${option['name']}</option>`);
    }

    return Options
}

function _SetLoadding(ButtonRef, loadding, showGif = true){
    ButtonRef.disabled = loadding;

    if(showGif){
        const LoaddingSpanRef = document.getElementById("loadingSpan");
        LoaddingSpanRef.hidden = !loadding;
    }
}

function _formatButton(button){
    switch (button.type) {

      case "URL":
        return `Tipo: ${button.type} | Texto: ${button.text} | Valor: ${button.url}`;

      case "PHONE_NUMBER":
        return `Tipo: ${button.type} | Texto: ${button.text} | Valor: ${button.phoneNumber}`;

      case "QUICK_REPLY":
        return `Tipo: ${button.type} | Texto: ${button.text}`;

    }
};

function _getTemplateComponentsForCSV(components, type){
    
    let componentData = "";

    components.forEach(component => {

        if(component['type'] === type.toUpperCase()){

            if(type === 'button'){
                
                componentData = component.buttons.reduce((initial, button) => {
                    return `${initial}${_formatButton(button)}`
                }, "" )
            }
            else{

                const text = component.text || "";

                if (text.charAt(0) == '"'){
                    componentData = text.split('\n').join(' ');
                }
                else {
                    componentData = `"${text.split('\n').join(' ')}"`;
                }
            }
        }
    })

    return componentData
}

function _prepareCSV(csvRawData){
    let csvData = "";
    csvRawData.forEach(data => {
        csvData += data;
        csvData += '\n';
    })
    return csvData
}