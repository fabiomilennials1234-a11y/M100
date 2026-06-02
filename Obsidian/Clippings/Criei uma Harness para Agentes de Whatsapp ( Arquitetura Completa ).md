---
title: "Criei uma Harness para Agentes de Whatsapp ( Arquitetura Completa )"
source: "https://www.youtube.com/watch?v=uezD0dRdz9Q"
author:
  - "[[Ronnald Hawk]]"
published: 2026-04-16
created: 2026-05-24
description: "––– Recursos & Educação –––Comunidade (Engenharia de IA de verdade)  https://www.rhawk.pro/comunidade https://rhawk.pro/biblioteca/conteudo/guia-llms-locais–..."
tags:
  - "clippings"
---
![](https://www.youtube.com/watch?v=uezD0dRdz9Q)

## Transcript

### Introdução

**0:00** · A harness é o produto. Cloud Code e Codex são ótimos exemplos disso, mas você não precisa ficar limitado a ser um operador de harness. Na verdade, você deveria construir harness. Nesse vídeo, você vai entender definitivamente que é uma harness, vai ver a arquitetura por trás da harness que eu criei e vai entender definitivamente que a vai muito além de vibe coding. Eu sou o Hulk. Eu ajudo indivíduos e empresas a colocarem soluções geral em produção e lucrarem com isso. Se você quer entrar em contato ou quer entrar na comunidade, os links estão na descrição. Bora pro vídeo.

**0:31** · Vamos lá. Tem muita coisa que eu quero te mostrar nesse vídeo, mas vamos pular direto paraa solução em funcionamento, que aí depois eu consigo fazer uma engenharia reversa e te explicar desde os conceitos até a arquitetura. Então vamos lá. Eh, tem uma conversa aqui já rolando nesse meu bote e eu vou falar com ele. Ainda não decidi. Você vai ver aqui que é o meu sistema, ele vai receber a mensagem. Em algum momento ele vai atualizar o que tá acontecendo aqui.

### Demonstração da Harness para Whatsapp

**0:56** · Você vê que tem um um tiquezinho aqui de como se alguém tivesse digitando. Você vê que a mensagem entrou na minha fila, ela começou a processar, né? A gente vai esperar um pouquinho e logo após a gente vai receber a resposta. Você vê que vai acontecer várias coisas aqui nesse meu agente ao longo desse processo. E exatamente todo esse processo aqui é que a gente chama de harness, né? E você viu que a mensagem chegou, ele mandou a mensagem enorme, parará, parará. E aqui dentro da minha harness, deixa eu fechar o WhatsApp porque essa interface tá horrível, né? Deixa eu fechar isso aqui para eu te mostrar mais isso aqui.

**1:27** · Isso aqui faz parte da observabilidade da harness. Além disso, essa harness tem, por exemplo, se você quisesse listar todas as conversas que aconteceram, você teria todos os seus agentes. E aí você tem a fila aqui e a parte de segurança que a gente, eu não vou tocar no assunto aqui muito, mas é basicamente para você administrar eh usuários, tá? Então vamos lá.

**1:49** · O ponto de conversa é esse artigo aqui.

### O que é Harness e Harness Engineering

**1:52** · A gente vai definir o que é uma harness, tá? E eu não vou tirar essa definição da minha cabeça ou achismos.

**1:57** · Tem um artigo muito recente que eu gostei bastante. Eu inclusive discuti com ele na comunidade essa semana.

**2:02** · Então, se você tá na comunidade, não acompanhou na live dos membros, eu a gente discutiu esse assunto aqui, foi muito legal. Eh, a gravação a essa altura já tá lá disponível na plataforma também. Você pode acompanhar se você não tava lá ao vivo, tá? E se você tem interesse, considere a comunidade, porque é exatamente esse tipo de coisa que a gente discute. Show de bola, tá?

**2:21** · Qual é o problema? Qual é o desafio da harness, né, desse termo? E aí, provavelmente, você já ouviu esse termo como vibe code. Então, assim, ah, agora não basta você saber fazer um prompt, agora você tem que saber skill, você tem que saber harness, parará, parará. Isso é uma meia verdade, né? Porque você tá lidando com harness.

**2:38** · Esse vídeo aqui é sobre construir harness, tá? Então, vamos pegar essa definição aqui, digamos assim, oficial ou sei lá, eh, acadêmica e a gente vai partir dela, tá? O que simboliza essa ideia da harness?

**2:54** · Essa palavra aqui é muito forte, externalização. E o que seria externalização?

**2:59** · Antigamente, tem uma gravura aqui muito boa que eu quero mostrar para vocês.

**3:02** · Antigamente, quando começamos aqui na área, era basicamente o seguinte: tinha-se a ideia de que a LLM já era boa suficiente do jeito que ela era e tudo que você precisava era mandar as coisas para ela e ela ia resolver tudo isso aqui no 2022, 2023. Beleza? A gente tinha essa essa ideia. A gente não, né?

**3:23** · a boa parte do mercado. Quem já estava mais familiar já via que tinha algumas limitações. Depois disso, vi veio a onda do context engineering, né? Engenharia de contexto. Todo mundo aí conhece, todo mundo sabe, né? Ah, não, não basta mandar para ela, mas você deve gerenciar o contexto que ela recebe de modo que ela responda de maneira ótima. E isso continua sendo verdade.

**3:46** · Só que eh chegou-se a uma realidade, quem já tava construindo sabe disso. E eu fico muito feliz que esse nome Harness tenha chegado ao público geral, né? Tenha se tornado uma palavra eh de conhecimento comum, porque basicamente é o que eu tenho feito aqui no canal há um ano, né? Eu tenho falado sobre construir sistemas de a e não chamar uma IPI, né?

**4:07** · Que são coisas bem distintas. E agora a gente convencionou de chamar isso de harness. Então você acompanha aqui, a gente já fazia engenharia de contexto, mas não tinha nome. Aí virou engenharia de contexto e a gente já tá fazendo runness há um tempo, só que não existia nome, mas basicamente com essas ferramentas do tipo Codex e Cloud Code, isso ficou muito popular. E aí basicamente o seguinte, o que que a Harness quer fazer? Ela quer extrair o melhor do modelo, deixando o modelo fazer o que ele é bom e removendo do que o modelo do que ele não é bom.

**4:35** · E é basicamente o que a gente tá fazendo. É basicamente o meu canal é sobre isso, né? Eu falo isso constantemente, tá? Uma definição mais formal aqui tem bem aqui embaixo que eu quero mostrar para vocês.

**4:46** · E aí você deve tá se perguntando, Ronê o link desse troço parará, etc. e tudo mais. Eu criei um artigo, mais um artigo, cara, aqui conteúdo mais rico da internet disparada no tema gratuito, tá aqui. Eh, em que é um é uma uma extensão desse vídeo aqui, obviamente, você tiver interesse em lê-lo, tá lá disponível. E o link desse exato artigo tá aqui. Então você pode ler aí por conta própria. Eu recomendo fortemente você ler se você tem interesse no tema, beleza? E você tá na comunidade, a gente discute isso lá e tem aula gravada lá. Aula não, né? Foi um foi um bom debate com a galera, tá?

**5:19** · Então, basicamente o seguinte, se você pensar em harness, pelo menos na definição do artigo, ele chama isso aqui de seis camadas. Ele chama isso aqui de camadas, tá? Isso é interessante, tá? A minha solução aqui que eu vou mostrar para vocês, eu vou mostrar arquitetura, eu uso quatro ou cinco camadas dessa aqui. E aí muitas dessas camadas são observabilidade. Então você vê, por exemplo, ali, eu mostrei para vocês é uma uma um certo de observabilidade. O alguém mandou um mensagem no chat, a mensagem bateu no meu sistema, eu vi que ela entrou na fila. Se tivesse algum erro, eu ia ver que teve erro, etc, etc.

**5:51** · Eu consigo acompanhar toda a telemetria, etc, etc. observabilidade. Você tem a questão da memória. Eu vou mostrar exatamente como a memória é gerenciada nesse tipo de solução aqui. E aí você tem outras coisas como comunicação externa, etc, etc. Então é basicamente a Harness faz isso. Ela se ocupa de todas as coisas que a LLM não se ocupa, entende? É basicamente o que eu falo aqui de sistemas de A meses. Show de bola. Então assim, ah, Harness agora, cara, não, a gente já tá fazendo isso um ano, não é novidade, tá? Então não, não.

**6:19** · Ah, meu Deus. Não, não é, não muda tudo.

**6:21** · Já mudou há um ano e agora é que tá chegando no grande público. Show de bola. Show de bola. Tá. E aqui a gente tem uma definição eh mais direta, né, que seria a prática de fazer um scaffolding e convertendo o poder bruto do modelo. E se você trabalha com modelo já um tempo, você já sabe que eles t um poder bruto, mas às vezes eles cometem erros, eles eles vacilam, eles não respondem como a gente quer, de maneira que a gente possa confiar. Então, e por que que isso é interessante?

**6:51** · Você vê que tanto a Codex quanto a Open AI, né, tanto a Open AI quanto o Cloud começaram só vendendo API e agora eles vendem um produto. Esse produto é harness, tanto o Codex quanto o Cloud Code ou quanto a plataforma deles. Aquilo lá já se tornou uma plataforma, né? Já não é mais você chamar uma eh pedir uma resposta, ele entregar. Isso já já ficou dois anos atrás. E exatamente isso que você deveria tá fazer se você quer fazer dinheiro nessa área ou se você tá procurando emprego nessa área. É isso que a gente tá fazendo há um tempão. Só que agora tem o nome e isso é muito bom.

**7:23** · Teu nome é ótimo. Então se você quer e aprofundar teu estudo teórico nisso aqui, um ótimo artigo. Beleza? Show de bola. Vamos voltar para cá que agora eu quero falar da arquitetura, tá?

**7:34** · arquitetura tá aqui. Eu vou passar ela por diferentes eh pedaços dela. Eu vou explicar passo a passo. Mas antes que você se confunda, vamos deixar isso aqui bem claro, tá?

**7:47** · O que que é uma harness e o que que não é uma harness? Eu só chamo API, só chamo API, não é harness. Um app com um agente não é harness. Por exemplo, aqui na Rock Pro a gente tem esse cara aqui. Esse cara aqui é só um agente, tá vendo? Ele não é uma harness. No futuro será, mas ele ainda não é. Show de bola. Show de bola. Tá, uma runtime. O que que seria uma runtime? Você precisa de algum jeito de guardar informação, recuperar informação, controle e tudo mais. Isso aqui já seria assim o o primeiro passo legal para você ter uma harness.

### Da API à Harness

**8:16** · E a harness, na verdade, é uma arquitetura geral que você pensa desde o início para criar tua solução. E eu tô falando do ponto de vista de quem cria e não só de quem opera. Beleza? Qual é a vantagem de você aprender a construir harness? Uma vez você entende como uma harness funciona e de fato como uma LLM funciona, você até vibe coding você faz melhor, porque você entende de fato como uma harness é composta e você não precisa ficar em 1000 tutoriais de como fazer cloud code, porque você sabe como uma harness funciona. Daí para você é óbvio, você só usa e tudo bem, beleza?

**8:48** · Show de bola. Tá bom?

**8:50** · Qual é o legal disso aqui? E aí, particularmente na eh nesse caso aqui de agente de WhatsApp, qual é a dificuldade de fazer agente de WhatsApp? O WhatsApp tem várias restrições, né? Por exemplo, você no WhatsApp não tem uma thread, né?

### Arquitetura e separação de responsabilidades

**9:04** · Você não consegue, por exemplo, clicar no novo botão e falar assim: "Ah, me dá uma nova tradumente a gente usa a thread como algum identificador do telefone ou algum hash do telefone ou algo do tipo. Isso é um desafio enorme porque todas as outras soluções de A, você pode criar uma nova trad." Então, por exemplo, você tem que ser muito ciumento em relação ao contexto. Isso você tem que pensar o tempo inteiro. Fora isso, você tem questões de operação, memória, parará, parará, parará.

**9:30** · E aí com a harness exatamente isso. É exatamente isso que o Cloud Code faz, por exemplo, com memória quando ele compacta. É exatamente esse tipo de coisa que ele faz com skills, etc, etc.

**9:42** · A harness é dividida por responsabilidade. Beleza? Show de bola.

**9:46** · E o que eu fiz aqui na nossa arquitetura, que eu vou mostrar já já para vocês, é basicamente isso. A gente tem um canal de usuário, então todo mundo manda mensagem de algum jeito.

**9:55** · Oficialmente ele vai pra meta. Da meta ele vai para você. Aí você pode ter um provedor no meio, pode ser um provedor oficial ou não oficial, não interessa.

**10:03** · Então a gente deixa isso isolado. A gente tem a borda. O que seria a borda?

**10:06** · Quando a gente fala de borda, éonde a gente recebe a mensagem. E aqui é muito legal porque, por exemplo, se você tem um sistema como o, já posso falar falecido NN, não sei, né? Mas a galera tá abandonando completamente, mas era muito comum até ano passado, eh, que você tinha lá, eh, um agente de WhatsApp, tudo no mesma VPS, né, por exemplo.

**10:26** · E aí o que acontecia, e eu peguei vários erros desse no ano passado aqui de cliente, que era eh em horários de pico, por exemplo, o agente simplesmente parava de responder e era um erro silencioso, porque basicamente a borda era fraca. Então, eh, o agente ficava processando a mensagem, enquanto novas mensagens chegavam, a máquina, né, a CPU não suportava mais mensagens e aí simplesmente o sistema rejeitava a mensagem e era um erro silencioso porque ninguém nem sabia onde estava a mensagem.

**10:55** · Então, a gente tem uma camada aqui de borda que resolve esse problema de receber mensagem e obviamente valida parará, enfilera. Eu vou falar dessa dessa questão do enfileiramento. A gente tem o processamento, a gente tem a cognição, eu chamo de inteligência, depende como você quer quiser chamar. E aqui tem três camadas, tem o próprio agente, tem o gerenciamento de contexto automático, que eu coloquei uma sumarização automática que você pode customizar, então é uma harness para você customizar, né? E tem a memória semântica, que é basicamente lembrar fatos do seu usuário. O que seria lembrar fatos?

**11:28** · Vou imaginar que seu usuário continue conversando. A memória, como eu tô usando uma memória, um contexto automaticamente, eh, eu sumarizo o contexto, igual o Cloud Code, o Codex faz, eh, alguma coisa pode se perder ali, beleza? Só que de repente ele tem uma informação muito importante, sei lá, ele fala que gosta de chocolate e você gostaria de salvar essa informação. Esse é um outro tipo de contexto, é um outro tipo de memória e é tratado de uma outra maneira aqui dentro da minha solução. Show de bola.

**11:52** · Depois disso, eu tenho toda a questão da persistência histórico operacional, é aquela coisa que você viu ali no painel administrativo. E você tem de fato a operação observabilidade paraará, que você também viu no painel administrativo. Então você entende que o meu agente tá aqui, o meu agente é esse verdinho aqui, correto? É esse cara aqui. Só que a harness é composta de todas essas coisas aqui. E aí você pode pensar na harness, você fizer uma tradução literal como cabresto, né, como eh um certo controle.

**12:20** · E é exatamente como eu gosto de lidar com LLMs desde o primeiro dia que eu comecei a trabalhar.

**12:26** · Você tem que colocar ela no lugar dela e você tem que fazer ela obedecer. E não o contrário, não é ai meu Deus, aí a não é assim. E aí aquela ideia de AGI que a gente tinha inicialmente que seria o modelo que resolveria tudo, na verdade hoje a gente já entendeu que podemos criar sistemas muito inteligentes.

**12:44** · Codex, Cloud Code tentam ser sistemas genéricos, né? Mas você pode criar sistemas inteligentes que resolvam o teu problema, o problema da tua empresa, o problema do agentes de WhatsApp. Agentes de WhatsApp sempre foram um desafio. Se você trabalha com isso, se adotar, você vai ter que fazer um e aí você vai ver quantos pecinhas soltas tem antes de você chegar na agente e exatamente essa arquitetura resolve este problema. E aí, qual é a vantagem de você usar é uma arquitetura e criar uma harness para você mesmo?

**13:10** · Porque se você não tá criando um caso genérico, né, por exemplo, o cloud Code, o Codex, eles tentam resolver tudo, você resolve um único problema e você vai descobrir que modelos são commodities e você não precisa usar o modelo mais caro, você pode usar sempre o modelinho que cabe no bolso e aí de fato você cria um produto e aí de fato você cria a solução. Não é aquela fantasia de sistema operacional de ah parará e tudo mais. Beleza? Show de bola. Então se de repente você quer um sistema operacional, né, um sistema de operação pra tua empresa, você deveria estar olhando para harness.

**13:41** · Show de bola. Agora vamos pra arquitetura, vamos pra fase boa. Aqui tem um monte de coisa que eu quero mostrar aqui para vocês. Quero um monte de coisa, um monte de coisa, tá? Vamos lá. Então, a arquitetura completa é essa aqui, tá? São vários passos. Eu vou detalhar cada um. Eu dividi ele em pequenos pedacinhos para você conseguir visualizar exatamente como uma harness dessa tá estruturada, tá? Vamos lá.

### Arquitetura da harness para WhatsApp (Fila, Workerers e Contexto)

**14:03** · Componentes iniciais aqui que eu botei tem um contexto da thread. Então, o que que é uma thread? Toda vez que você começa uma conversa lá no chat GPT, no cloud, etc, etc, é uma trad, correto?

**14:13** · Mais uma vez, WhatsApp, você não tem uma nova thread, você não consegue dar uma nova trad, né? Você não consegue apertar no botãozinho. Então, esse contexto é muito importante desde o início e faz parte da arquitetura pensada desde o início. A gente tem aqui o nosso usuário, a gente tem obstavabilidade, como você já viu, e você tem a memória semântica. Eu tenho um vídeo aqui sobre memória semântica. Se você não sabe o que que é, dá uma olhadinha lá se você quiser se aprofundar. Também tem artigo na Uprock Pro sobre memória semântica. E você vai ver que é basicamente é assim que esses sistemas modernos, como o o a Open AI ou o Cloud, eles lembram coisas sobre você.

**14:44** · A gente quer isso aqui dentro da nossa harness porque eu entendo que agentes de WhatsApp e é importante ele lembrar coisas do usuário ao longo do tempo. Beleza? É assim que funciona.

**14:55** · Legal. Primeira coisa, que acontece aqui, vamos dar um zoom. O usuário mandou uma mensagem, igual a gente viu ali no começo do vídeo, ele mandou a mensagem, a gente recebe essa mensagem.

**15:05** · Então eu tenho uma entrada que é um web hck lá, né, só para receber este cara.

**15:11** · Ele não faz nada. Você vê que a gente tem arquitetura separada por responsabilidades. A gente chama isso de fronteira de arquitetura. Então a gente tem uma parte do nosso da nossa harness que se ocupa apenas apenas e é bastante coisa se você começar a ver em receber a mensagem bem. Por que que você quer fazer isso? Quando a meta te manda mensagem, por exemplo, ele espera que você receba a mensagem e mande um OK para ele. Fala assim: "Ó, recebi a mensagem legal". Porque o que acontece?

**15:42** · Se você, se ele te mandar a mensagem e você não receber, ele pode até tentar fazer um retry, mas a mensagem em última instância é perdida para sempre. Então, é importante você garantir que você recebe a mensagem quando ela chega. Show de bola. Show de bola. Tá? Depois você valida. Pô, o payload é válido, o que eu recebi é válido. Por que que você quer fazer isso? Pode ser que alguém tá tentando usar esse seu web hug, esse seu essa porta sua que tá na internet para mandar uma mensagem que não deve, você não deveria estar recebendo, tá?

**16:08** · Então essa verificação existe aqui exatamente para você garantir que o que vai entrar daqui pra frente faz sentido. Beleza? Se não for, você rejeita e nada acontece. Você só guarda no log, eventualmente você vai ver que alguém tá tentando te atacar. É importante. Beleza? Show de bola.

**16:27** · payload válido. Então o que eu faço aqui? Eu tenho rate limitada porque e eu tive um cliente que reclamou que ele fez um chatbot, é um um agente, né, de WhatsApp, aí ele disparava a mensagem, só que o que tava do outro lado também era um agente de WhatsApp. E aí esses agentes ficavam aqui mandando mensagem infinitamente um pro outro, sem limite nenhum. E aí a conta dele chegou caríssima e tal. E esse é um caso real.

**16:52** · fora que alguém pode tentar eh abusar do uso do teu serviço, por exemplo. Então, a gente tem o rate limit aqui. O que que seria esse rate limit? Ele evita que existam abusos em cima do teu serviço.

**17:05** · Beleza? Isso é importante porque a gente tá lidando com custos de API e API pode ser cara no final das contas. Isso é importante. Você tá criando uma solução comercial. Show de bola. Show de bola. A normalização garante que não entrou nenhum lixo ali, que vai dali pra frente. Beleza? Próximo passo, eu verifico se é texto ou se é mídia. Por exemplo, é muito comum no WhatsApp as pessoas mandarem áudio, correto? É muito comum no WhatsApp as pessoas eventualmente mandarem mensagens.

**17:31** · Obviamente em um em um agente, né? Eu não eu não vejo muitos casos que as pessoas mandam mensagem, mas pode existir. Dentro dessa isso já tá previsto. A gente tá verificando tanto eh imagem quanto áudio, mas nada impediria de a gente verificar vídeo também. Aqui, se é vídeo, eu tô mandando uma mensagem, não mostrei aqui para não ficar muito grande, mas se for vídeo eu mando uma resposta falando que eu não suporto o formato. Mas se for texto ou mídia, quer dizer, se for mídia, né, áudio ou imagem, eh, eu rodo esse processamento aqui, tá?

**18:01** · Que é basicamente eu transformo a mídia em texto e depois eu enfilero. Eu vou chegar lá já. Aguenta aí. Sei que você ficou ansioso, tá? Eh, e se for texto, eu faço debouncer. Por quê? Por que que eu verifico?

**18:16** · Tem muitas pessoas que mandam mensagem no estilo, oi, enter, como vai? Enter.

**18:20** · Parará, parará. Então, o Thebouncer tá ali basicamente para esperar esse cara mandar essa mensagem e depois enfilhar ambos esses caras aqui na nossa harness, ele tá configurável. Então, o que significa? Ah, Rolland, eu não quero suportar imagem, por exemplo, eu vou dizer que é só texto. Então, tem um botãozinho lá que você configura um botãozinho, não é no arquivo de configuração, literalmente. Isso tudo tá feito em Python, tá? Ainda não falei da Steck, mas eu vou falar já já. tá aí na capa, mas eu vou falar já já a partir de agora que a primeira coisa que você vai ver aqui é uma fila. O que que seria a fila?

**18:51** · A fila faz parte desse sistema de ingestão aqui e ela recebe a mensagem. O que que seria essa mensagem que entrou?

**19:01** · Seja áudio, seja texto, parará, ela vai entrar aqui na fila. E como que isso se dá? O que que é isso aqui? Tá? Isso é responsável exatamente por eh dar o alívio a essa esse sistema de entrada.

**19:15** · Então a gente tá só se ocupando aqui em receber a mensagem e acabou, tá? A gente recebeu a mensagem, é a primeira missão do nosso sistema é receber bem a mensagem. E o que eu decidi fazer aqui?

**19:26** · Isso é uma fronteira de arquitetura que você deve definir desde o início. E é por isso que é importante você pensar.

**19:32** · Nós poderíamos receber mídia, áudio, parará, vídeo aqui no nossa inteligência, no nosso agente. A gente vai chegar aqui. Só que essa fronteira aqui ficaria meio estranha, né? Porque eu teria que converter um formato ou teria que garantir que eu tô usando alguma LLM multimodal, o que não é meu interesse aqui, porque eu quero aqui que seja genérico. Eu quero usar qualquer tipo de LLM e eu quero usar Lin, Leng graphle, DP agents, tanto faz. Posso trocar entre um e outro, posso criar vários agentes independentes, então eu não quero limitar a solução aqui.

**20:02** · E aí tudo que eu fiz foi garantir que tudo que vai chegar na fila já é texto pré-processado, pronto para chegar no agente. Beleza? Beleza. Primeira coisa que você vai ver e aí você já deve estar reclamando aí se você é um grande friend do do ã de de pacote de enfileiramento, como Rebem aqui ou coisas do tipo, tá? O que que eu quero mostrar aqui para vocês? É, ó, existe uma lenda que fila você só pode fazer com serviços especializados. E obviamente isso não é verdade.

**20:32** · E a grande experiência que eu tive no ano passado de construir muitos agentes de WhatsApp para as pessoas ou refaturar coisas que estavam não tão legais é que a infraestrutura era superdimensionada e mal feita, né?

**20:49** · E a maioria dos casos o cara tem, sei lá, 50, 100 conversas por dia. E aí ele tava usando um cluster enorme de de todos os tipos de eh mensageria que existe. Obviamente, Ronald, eu trabalho no Itaú e aí eu tenho 1 trilhão de mensagens por dia. Aí de repente você vai ter que pensar numa numa ideia diferente. Só que aqui na arquitetura, se você reparar, eu tô usando uma fila em post grey, mas eu poderia estar usando qualquer outra tecnologia aqui, como revest aqui facilmente. Beleza? E por que que eu uso Bush Gray?

**21:18** · Porque como a nossa arquitetura aqui ela é bem enxuta e pronta para a expansão, então isso aqui tá tudo na comunidade, tá cara? Se você tá na comunidade ainda não viu, o código tá todo lá, inclusive eu esqueci de mencionar, tá? Eh, você pode trocar isso aqui se você quiser, porque isso é um componente da arquitetura, entende? A arquitetura está ser reparado por responsabilidades e você pode simplesmente usar o que for conveniente para você e trocar o que for inconveniente, tá? Então, mas é uma arquitetura pronta para expansão. Show de bola. Show de bola.

**21:48** · O que eu quero mostrar aqui rapidinho é, eu não sei se você conhece esse serviço aqui, Rodost, mas ele é um serviço muito bom. Quem quem é do mundo de dados provavelmente conhece mais. E eles usam Post Grey como fila, cara. Eles usam. Então assim, ah, 100.000 eventos por segundo, cara.

**22:03** · 100.000 1000 eventos por segundo.

**22:04** · Obviamente com a arquitetura que eu fiz aqui, com as escolhas que eu tomei, ele não vai suportar isso. Mas você pode ir bem longe com Post como fila e eu te garanto, se você usa o Supas, já viu o Supas ele tem o serviço de fila, ele usa Postgre, só que ele usa um plugin chamado PGMQ lá. E o que eu fiz aqui nessa arquitetura foi fazer uma fila manualmente. Então todo o processo é feito manualmente e é por isso que você vê todas as etapas ali, é, de maneira natural.

**22:31** · E eu decidi fazer essa essa arquitetura também para mostrar pros membros como fazer uma e para entender fila por dentro. Então é importante a gente entender esse conceito muito bem quando estamos querendo a gente e é por isso que eu fiz assim. Outro exemplo tem aqui nesse blog post da Planet Scale. Se você não conhece Planet Scale é um excelente serviço de banco de dados e eles fazem falam como você manter uma kill saudável usando postgar. Eles explicam como, por e parará. Obviamente esse aqui são tópicos avançados. Você tem interesse, comunidade, etc, etc.

**23:01** · Show de bola. Tá bom. OK. Beleza. A mensagem foi recebida, ela entrou na fila. O que será entrar na fila? Ela entrou no meu banco de dados. Ela tá pronta para ser processada, tá? O meu agente tá aqui. Aí você fala assim: "Cara, Ronald não não entrou no agente, não entrou". E aí a gente vai entender o porquê. O que que seria um worker, tá? O worker ele é responsável por vir aqui nessa fila e pegar essa mensagem, tá? Só que você não precisa ter um worker, você pode ter n workers. O que significa? Se você tiver 10 pessoas mandando mensagem, você pode ter 10 workers e assim por diante.

**23:31** · Obviamente tem outras técnicas aqui que você poderia aplicar, mas nessa arquitetura é assim que eu tô fazendo.

**23:37** · Então o worker pega uma mensagem e ele vai levar isso aqui paraa frente. E o que isso vai acontecer? Se o seu sistema começa a receber muita mensagem, e isso acontece bastante em agentes de WhatsApp, por exemplo, às vezes tem um horário de pico de atendimento, correto?

**23:51** · Você pode dimensionar sua solução para momentos de pico. Então você pode aumentar sua solução em aumento de pico, diminuir ela em momentos que não sejam de pico ou pode simplesmente usar de acordo com o que você entende lá. Eu botei dentro dessa harness um teste de carga. Então quando você botar em produção, você também faz um teste de carga que aí você consegue dimensionar se, por exemplo, ah, então eu tenho, sei lá, 10 mensagens por segundo, até onde essa minha infraestrutura suporta e tá tudo lá. Beleza? Então isso aqui é post gre, isso aqui é Python, Python puro, tá?

**24:22** · Já que eu fiz postg puro, eu fiz Python puro. E aí ele verifica se tem mídia, tá? Tem mídia, beleza? Ele faz o próprio processamento, né? E normaliza, limpa, parará, parará e manda pro agente, tá? Aqui, se é texto direto, ele já manda pro agente. Show de bola, né?

**24:40** · Então, o worker, ele tem um trabalho antes de mandar pro agente. Aqui a mensagem já tá bonitinha e ela vai entrar no agente, como você viu ali a resposta. E o que que vai acontecer aqui? Ele vai fazer o que ele tem que fazer. E aqui sim, cara. E é por isso que eu falo, cara, ganhe R$ 30.000 fazendo a gentear. Aí a pessoa, ela acha que fazer a gente isso aqui, cara, não é? E nem sequer isso aqui ela faz, na verdade, ela chama uma IPI às vezes, né?

### Arquitetura da harness para WhatsApp ( Langchain, LangGraph, Deep Agents) e produção

**25:05** · Então assim, só aqui, só nesse assunto aqui tem assunto para eu fazer o 500 horas de vídeo, entende? Então assim, você vê que a indústria ela tá precisando de gente que faça isso, ela quer isso, a indústria quer, ela tá sedenta, só que por conta do discurso da

**25:25** · maioria, né, que vende que aí, ah, é tudo fácil e parará, a gente ainda tá numa imaturidade do mercado, que é normal, e isso se reflete nos preços ou na percepção de valor de serviço, o que tá sendo resolvido aos poucos.

**25:40** · O que eu tenho percebido na consultoria é cada vez mais eu recebo cliente com um nível de consciência maior. Então eles já chegam entendendo boa parte disso aqui e entende muit das vezes que um projeto ele requer mais do que chamar um API, o que tem sido ótimo. E essa isso só vai aumentar, o que significa que quem se prepara, quem tem o nível de conhecimento maior, obviamente vai pegar as melhores oportunidades, assim como sempre foi. Beleza? Que que chega aqui?

**26:05** · O que que eu fiz aqui? Tá?

**26:08** · Para você que não conhece L chain, L graph, DP agents, DP agents é um pacote do L chain também, tá? O que que é isso aqui?

**26:15** · O leng, o L chain e o deep agents, na verdade, eles são lengra por debaixo dos panos, só que eles são uma abstração, tá? Então eles têm um monte de funções e conveniências que você pode usar ao invés de fazer tudo na mão. Nada impede de você usar link graph na mão e fazer tudo do jeito que você quiser, mas tem várias coisas pré-construídas que você pode simplesmente usá-las. E aí, o que que eu fiz aqui dentro dessa inteligência, dentro dessa camada aqui, eu tô exportando o que ele chama de grafo. Então não importa se você tá usando link chain, link graph ou deep agents.

**26:45** · Qualquer coisa que você quiser usar aqui, essa inteligência vai suportar. Então, basicamente, é uma harness bem genérica que você pode pegar, expandir ela pro teu caso de uso.

**26:55** · Você não precisa só fazer um agente React, né, que você conhece aqui, tem um monte de conteúdo meu aqui sobre agente React, mas você pode fazer agentes no estilo eh cloud codex que tem subagente, parará, você pode fazer o que você vai entender ou você pode fazer simplesmente um workfow, um workflow e tradicional do Leng Graphic também funcionaria bem. Se você vier aqui, ó, eh, aqui tem uma lista de agents, né, que eu botei aqui.

**27:18** · E aí, basicamente, você poderia ter n agentes aqui que você quisesse. Só tá um aqui na demonstração, né? Mas você poderia ter vários e diversos agentes aqui que ele faria o serviço para você.

**27:28** · Beleza? O agente processou, parará, tudo mais, ele vai gerar a resposta, né? É isso que o a gente faz. Ele processa e gera resposta. O que que vai acontecer aqui? A gente vai mandar um outbound. A gente vai mandar o outbound para onde?

**27:41** · Para onde eu tô enviando isso? Eu tô mandando de volta pro provedor, que no caso é um meta ou qualquer um outro que você use. Então ele vai processar e ele vai enviar. E aí você percebe, se você tá mais atento, quando eu recebo a mensagem e processo, eu fecho essa conexão aqui. Então você vê que não fica nada aberto, né? Não fica uma conexão aberta. Que o que acontece com o agente que, por exemplo, funcionam no eh num computador, por exemplo, né? Um chat normal. Enquanto você manda mensagem, a conexão fica aberta porque ele tá mandando token.

**28:10** · Aí você vê lá um streaming, né, que a gente chama, vê um monte de token chegando parará parará.

**28:15** · Aqui a gente não usa isso pela própria natureza do problema. E é sempre como eu falo, você tem que criar sua arquitetura em volta do problema que ele quer resolver. Beleza? Então aqui a gente recebe, fecha a conexão e aqui a gente reabre a conexão. Então reabre não, a gente abre uma nova conexão para mandar mensagem de volta pro usuário. E o que a gente faz é verifica se o foi enviado mesmo. Foi enviado mesmo, beleza? Foi enviado mesmo. A gente vai lá naquela fila lá que a gente criou, a gente marca como done.

**28:42** · Então tá acabado, tá feito, a gente processou essa mensagem e aí como você vê aqui, cadê? aqui na fila. É, a gente vai ver esses caras aqui, ó, concluído. E é exatamente por isso que eu fiz a fila na mão, pra gente poder ver exatamente tudo que acontece. E dentro desse processo aqui, se, por exemplo, aqui, ó, você tá vendo tentativa um, se por exemplo alguma coisa aconteceu aqui que falhou, por exemplo, tentou mandar, sei lá, a internet caiu, teve problema de rede, coisas que acontecem no mundo real, tá, cara? Isso acontece no mundo real e isso é engenharia de hardness, você tem que pensar nisso, tá?

**29:13** · Você vai voltar para cá e o que que você vai fazer? você vai mais uma vez enfilerar a mensagem, tá?

**29:20** · Então a mensagem vai sair daqui, vai voltar para cá, o nosso sistema tá configurado para fazer diferentes tentativas. Se eu não me engano, de cabeça tá três, mas vocês conferem aí, cara, no no na documentação.

**29:32** · Eh, e aí se fizer mais três vezes e falhar, e ele vai dar como dead, tá? Eu não eh avancei aqui em processamento de mensagem que tá dead e tudo mais. Isso são tópicos avançados, a gente pode discutir obviamente sobre, mas é essa a estrutura de uma harness, uma harness que diferente do cloud code do Codex que funcionam na sua máquina, essa harness aqui funciona online como um sistema que as pessoas usam, um sistema real e a de verdade vai pra produção. Esse aqui é mais um exemplo de A real que foi pra produção.

**30:02** · Se você tem interesse em treinamento pra tua equipe, conhecer mais sobre a IA real que o mundo tá fazendo, né? Eu sei que aqui no Brasil a gente tem um delay de informação, eh, e tem muito ruído, obviamente em todo lugar tem muito ruído, mas aqui parece que a gente tem um pouco mais. Hal pro empresas, os links na descrição, se você tem interesse em de fato construir eh como profissionais, comunidade. Beleza?

**30:25** · Prazer em revê-los. Até a próxima. Amen.