// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyA4MfBqHSewD5tVzdBGw-7gjXuClhhBADo",
    authDomain: "oficinadocortevalinhos.firebaseapp.com",
    databaseURL: "https://oficinadocortevalinhos.firebaseio.com",
    projectId: "oficinadocortevalinhos",
    storageBucket: "oficinadocortevalinhos.appspot.com",
    messagingSenderId: "664667062269",
    appId: "1:664667062269:web:4f5cbf7853ff065ca4e394",
    measurementId: "G-S5JY766G7W"
};

var mapDeBotoes;
var contProxAnterior = 0;
var grafico = null;
var objAuxAgendamento = { ano : 0, mes : 0, dia : 0, hora : "" };
var refAgendamentosDia = null;

$(document).ready(function() {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    // Initialize Navbar
    $('[data-toggle="offcanvas"], #navToggle').on('click', function () {
        $('.offcanvas-collapse').toggleClass('open')
    })

    $("#btn_salvar_configuracoes").on('click', function () {
        salvarConfiguracoes();
    });
    // Iniciais
    onLoad();
});

function onLoad() {
    // Configuração da linguagem do moment
    moment.locale('pt-BR');
    mapDeBotoes = obterConficuracoes(obterProximosDias());
    

    $('#spanHorasVoltar').click(function(){ exibirPagina("page01"); });
    $('#spanDashboardVoltar').click(function(){ exibirPagina("page01"); });
    
}

function obterProximosDias() {
    let map = new Map();
    let dias = 7;
    let qtd_atendimento_hora = 1;
    for (let i = 0; i < dias; i++) {
        let horas = [];
        for (let j = 0; j < 24; j++) {
            for (let k = 0; k < qtd_atendimento_hora; k++) {
                let hora = j < 10 ? "0" + j : j;
                hora += ":";
                hora += k == 0 ? "00" : "30";
                horas.push(hora);
            }
        }
        let data = moment().add(i, 'days');
        let obj = {
            texto_btn: data.format('dddd D MMM'),
            dia_texto: data.format('dddd'),
            dia: data.format('D'),
            mes: data.format('M'),
            ano: data.format('YYYY'),
            horas: horas
        };
        map.set(obj.dia_texto, obj);
    }
    return map;
}

function obterConficuracoes(map) {
    // Referencia para o nó configuracao
    ref = firebase.database().ref('configuracao/dia');
    // Obter Dados
    ref.once('value').then(snapshot => {
        snapshot.forEach(value => {
            let dia_config = value.val();

            $("#checkbox_" + dia_config.descricao).prop( "checked", dia_config.habilitado ).change();
            $("#select_inicio_" + dia_config.descricao).val(dia_config.hora_inicio);
            $("#select_fim_" + dia_config.descricao).val(dia_config.hora_fim);
            
            habilitarDesbilitarBtn("btn_" + value.key, dia_config.habilitado);
            if(!dia_config.habilitado) {
               return;
            }
            if (dia_config.hora_inicio === undefined || dia_config.hora_fim === undefined) {
                console.log(dia_config.descricao + " não ha horas configuradas");
                return;
            }
            let obj = map.get(dia_config.descricao);
            let total_itens = obj.horas.length;
            for (let i = total_itens; i >= 0; i--) {
                if(obj.horas[i] < dia_config.hora_inicio || obj.horas[i] > dia_config.hora_fim) {
                    obj.horas.splice(i, 1);
                }
            }
            $("#btn_" + value.key).text("✁ " + obj.texto_btn);
            $("#btn_" + value.key).click(function(){ obterHorarios(obj.ano, obj.mes, obj.dia, obj.dia_texto); });
        });
        // Apagando o Load
        $("#load_page01").hide();
        // Mapa de botoes ja modificado
        mapDeBotoes = map;
    });
}

function habilitarDesbilitarBtn(idBtn, habilitado) {
    if(habilitado) {
        //$("#" + idBtn).show();
        $("#" + idBtn).removeClass("d-none");
    }else {
        //$("#" + idBtn).hide();
        $("#" + idBtn).addClass("d-none");
    }
}

function obterHorarios(ano, mes, dia, key) {

    exibirPagina("divHoras");
    $("#divHorasCol1").empty();
    $("#divHorasCol2").empty();
    
    // Referencia para o nó configuracao
    ref = firebase.database().ref('agendamentos'.concat('/', ano, '/', mes));
    // Obter Dados
    ref.orderByChild("dia").equalTo(dia).once('value').then(snapshot => {

        let agendamentosDoDia = [];

        // checa se existe algo no snapshot * ao invez de ver se é null
        if(snapshot.exists()) {
            snapshot.forEach(value => {
                agendamentosDoDia.push(value.val());
            });
        }
        montarBotoesDia(key, agendamentosDoDia);
    });
}

function montarBotoesDia(key, agendamentosDoDia) {

    let obj = mapDeBotoes.get(key);

    $("#spanHorasDia").text("✁ " + obj.texto_btn);

    let chave = true;
    for (let i = 0; i < obj.horas.length; i++) {
        let horario_ocupado = false;
        for (let j = 0; j < agendamentosDoDia.length; j++) {
            if(agendamentosDoDia[j].hora == obj.horas[i]) {
                horario_ocupado = true;
            }
        }

        if (i % 2 == 0) {
            $("#divHorasCol1").append(obterBotaoHoraAgendamento(obj.horas[i], chave ? 1 : 2, horario_ocupado, obj.texto_btn, obj.dia, obj.mes, obj.ano));
            chave = !chave;
        }else {
            $("#divHorasCol2").append(obterBotaoHoraAgendamento(obj.horas[i], chave ? 1 : 2, horario_ocupado, obj.texto_btn, obj.dia, obj.mes, obj.ano));
        }
    }
}

function obterBotaoHoraAgendamento(hora, tipo, desabilitado, texto_dia, dia, mes, ano) {
    let classBtn;

    let hoje = moment();

    let dia_hoje = hoje.format('D');
    if(dia_hoje == dia)
    {
        let hora_agora = hoje.format('HH:mm');
        if(hora_agora > hora)
        {
            classBtn = 'class="btn btn-danger btn-block " disabled ';
        }
    }

    if(!classBtn) {
        if(desabilitado) {
            // vermelho
            classBtn = 'class="btn btn-danger btn-block " disabled ';
        }else if(tipo == 1) {
            // preto
            classBtn = 'class="btn btn-dark btn-block"';
        }else {
            // cinza
            classBtn = 'class="btn btn-secondary btn-block"';
        }
    }

    let btn = '<button type="button" ';
    btn = btn.concat(" onclick=\"agendar('"+ hora +"', '" + texto_dia + "', '" + dia + "', '" + mes + "', '" + ano + "')\" ");
    btn = btn.concat(classBtn);
    btn = btn.concat('>✁ '+ hora +'</button>');

    return btn;
}

function obterNovoAgendamento(dia, hora, nome, fone) {
    let agendamento = {
        cancelado : false,
        confirmado :  false,
        dia : dia,
        fone : fone,
        hora : hora,
        nome : nome
    };

    return agendamento;
}

function agendar(hora, texto_dia, dia, mes, ano) {
    $("#txt_nome_modal").val("");
    $("#txt_fone_modal").val("");
    $('#txt_dia_modal').text(texto_dia + " " + hora);
    objAuxAgendamento.ano = ano;
    objAuxAgendamento.mes = mes;
    objAuxAgendamento.dia = dia;
    objAuxAgendamento.hora = hora;
    $('#meuModal').modal('show');
    $("#erro_agendar").text("");
}

function confirmarAgendamento() {
    realizarAgendamento(objAuxAgendamento.ano, objAuxAgendamento.mes, objAuxAgendamento.dia, objAuxAgendamento.hora, "", "");
}

function realizarAgendamento(ano, mes, dia, hora, nome, fone) {

    nome = nome === "" ? $("#txt_nome_modal").val() : nome;
    fone = fone === "" ? $("#txt_fone_modal").val() : fone;

    let erro = false;
    if(nome.length == 0) {
        $("#erro_agendar").text("***Informe o Nome***")
        erro = true;
    }

    if(!erro){
        let novo_Agendamento = obterNovoAgendamento(dia, hora, nome, fone);

        // Referencia para o nó configuracao
        ref = firebase.database().ref('agendamentos'.concat('/', ano, '/', mes));
    
        ref.push(novo_Agendamento).then(snapshot => { 
    
            $('#meuModal').modal('hide');
            exibirPagina("page01");
        });
    }
}

function exibirPagina(paginaVisivel) {

    $("#imagemPrincipal").show();
    $("#page01").hide();
    $("#divHoras").hide();
    $("#divDashboard").hide();
    $("#divConfig").hide();

    $("#" + paginaVisivel).show();
}

function motarGrafico() {
    $('.offcanvas-collapse').toggleClass('open')
    exibirPagina('divDashboard');
    $("#imagemPrincipal").hide();

    if(grafico == null) {
        grafico = Morris.Donut({
            element: 'donut-example',
            data: [
                {label: "Agendamentos \n Confirmados", value: 39},
                {label: "Agendamentos \n Cancelados", value: 11},
                {label: "Agendamentos", value: 50}
            ],
            backgroundColor: '#ccc',
            labelColor: '#6c757d',
            colors: [
                '#28a745',
                '#dc3545',
                '#6c757d',
            ],
            formatter: function (x) { return x + "%"}
        });
    }

    montarTableAgendamentos(true, false);
}

function montarTableAgendamentos(inicial, proximoDia) {

    let data = moment();

    if(!inicial) {
        if(proximoDia) {
            contProxAnterior++;
            data.add(contProxAnterior, 'days');
        }else {
            contProxAnterior--;
            data.add(contProxAnterior, 'days');
        }
    }

    $("#text_dashboard").text(data.format('dddd D MMM'));

    var table = $('#table_dashboard');
    table.find("tbody tr").remove();
    var array = [];

    // Referencia para o nó configuracao
    
    if(refAgendamentosDia != null) {
        refAgendamentosDia.off();
        refAgendamentosDia = null;
    }
    refAgendamentosDia = firebase.database().ref('agendamentos'.concat('/', data.format('YYYY'), '/', data.format('M')))
    // Obter Dados
    refAgendamentosDia.orderByChild("dia").equalTo(data.format('D')).on('child_added', snapshot => {
        
        let obj = {nome : snapshot.val().nome, hora : snapshot.val().hora};
        array.push(obj);

        montaTable(array);
    });
}

function montaTable(array) {

    var table = $('#table_dashboard');
    table.find("tbody tr").remove();

    array.sort((a,b) => (a.hora > b.hora) ? 1 : ((b.hora > a.hora) ? -1 : 0));

    for (let index = 0; index < array.length; index++) {
        table.append('<tr><td>' + array[index].nome + '</td><td>' + array[index].hora + '</td></tr>');
    }
}

function montarConfig() {
    $('.offcanvas-collapse').toggleClass('open')

    exibirPagina('divConfig');
    $("#imagemPrincipal").hide();

}

function salvarConfiguracoes() {
    // Referencia para o nó configuracao
    ref = firebase.database().ref('configuracao/dia');
    ref.child("segunda").update({ 
        habilitado : $('#checkbox_Segunda-feira').prop('checked'),
        hora_inicio : $("#select_inicio_Segunda-feira").val(),
        hora_fim : $("#select_fim_Segunda-feira").val()
    });
    ref.child("terca").update({ 
        habilitado : $('#checkbox_Terça-feira').prop('checked'),
        hora_inicio : $("#select_inicio_Terça-feira").val(),
        hora_fim : $("#select_fim_Terça-feira").val()
    });
    ref.child("quarta").update({ 
        habilitado : $('#checkbox_Quarta-feira').prop('checked'),
        hora_inicio : $("#select_inicio_Quarta-feira").val(),
        hora_fim : $("#select_fim_Quarta-feira").val()
    });
    ref.child("quinta").update({ 
        habilitado : $('#checkbox_Quinta-feira').prop('checked'),
        hora_inicio : $("#select_inicio_Quinta-feira").val(),
        hora_fim : $("#select_fim_Quinta-feira").val()
    });
    ref.child("sexta").update({ 
        habilitado : $('#checkbox_Sexta-feira').prop('checked'),
        hora_inicio : $("#select_inicio_Sexta-feira").val(),
        hora_fim : $("#select_fim_Sexta-feira").val()
    });
    ref.child("sabado").update({ 
        habilitado : $('#checkbox_Sábado').prop('checked'),
        hora_inicio : $("#select_inicio_Sábado").val(),
        hora_fim : $("#select_fim_Sábado").val()
    });
    ref.child("domingo").update({ 
        habilitado : $('#checkbox_Domingo').prop('checked'),
        hora_inicio : $("#select_inicio_Domingo").val(),
        hora_fim : $("#select_fim_Domingo").val()
    });
}