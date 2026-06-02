---
title: "GUARDRAILS | o Controle que sua IA ainda Não tem"
source: "https://www.youtube.com/watch?v=gGY1vn94rV8"
author:
  - "[[Ronnald Hawk]]"
published:
created: 2026-05-24
description: "––– Recursos & Educação –––Comunidade (Engenharia de IA de verdade)  https://www.rhawk.pro/comunidade https://rhawk.pro/biblioteca/conteudo/guia-llms-locais–..."
tags:
  - "clippings"
---
![](https://www.youtube.com/watch?v=gGY1vn94rV8)

––– Recursos & Educação –––Comunidade (Engenharia de IA de verdade) https://www.rhawk.pro/comunidade https://rhawk.pro/biblioteca/conteudo/guia-llms-locais–...

## Transcript

### Introdução: por que sua IA precisa de guardrails

**0:00** · Você precisa de guard raios em sua solução. E existe muita confusão no mercado sobre o tema, muito porque as coisas evoluíram muito de um ano para cá e tem muito mais gente falando do que fazendo. Nesse vídeo aqui a gente vai acabar com isso. Eu vou te mostrar exemplos práticos do que é um guard raio e você vai entender as três diferentes camadas e responsabilidades de um guard reio numa solução do mundo real. Eu vou mostrar código e tudo mais e a gente vai entendendo no detalhe. Eu sou o Hulk. Eu ajudo indivíduos e empresas a colocarem soluções de em produção e lucrarem com isso.

**0:28** · Se você é um indivíduo procurando conhecimento ou uma empresa procurando ajuda para implementar soluções de a, ambos os links estão na descrição. Bora pro trabalho. No último vídeo, eu falei sobre esse sistema aqui e eu falei como ele é montado. Falei bastante de harness, etc, etc. E muita gente me perguntou e no Instagram e algumas aqui no YouTube sobre guardreios por conta disso. E a pergunta era: "Aonde fica o guardreio? como lidar com guardio, etc, etc.

### Onde os guardrails entram na arquitetura de agentes

**0:54** · Em sistemas assim, eu acredito que o melhor lugar para você colocar o guardio seria nessa camada aqui, que seria na camada de inteligência. E eu vou te explicar o porquê e porque isso é importante e como você deveria fazer. E eu vou te mostrar código aqui usando LC Chain hoje, beleza? Então vamos nos atentar aqui, depois eu volto aqui e você vai entender perfeitamente porque tá aqui, tá? Primeira coisa que eu posso te mostrar é isso aqui, tá? Esse aqui é o gráfico que eu vou mostrar para vocês.

**1:19** · Basicamente é um agente. Se você nunca viu isso aqui, tá assustado, calma, você vai entender tudinho. Não tem dificuldade nenhuma aqui. É só você entender as ideias centrais, tá? Coisas principais que você já deve reconhecer aqui. Você tem um modelo, né? Então você tem um agente, o agente tem um modelo, não tem agente sem modelo. E o agente também tem ferramentas, correto? Então você tem o modelo e a ferramenta. Todas as outras caixinhas que você tá vendo aqui são guard rails, tá? Então eu vou te mostrar esses diferentes níveis e os diferentes escopos de atuação de cada um.

**1:50** · E aí você vai entender de fato que guard rail não é uma palavra que significa apenas uma coisa, mas ela é um conjunto de coisas que você pode aplicar na sua solução para fazer com que ela seja resiliente, que ela não fale o que não deva falar, evitar ataque de gente maliciosa, etc, etc. Antes de mais nada, como eu tô usando o link chain, a gente tá usando esse pacote aqui, create agent, tá? Então, o que ele faz pra gente é isso aqui. Ele é você pega o modelo, você pega a ferramenta e você tem este layout aqui, né?

**2:20** · Você viu lá eh no meu exemplo anterior que a gente tem eh várias coisinhas ali, várias caixinhas e aí de repente você fala: "Ah, cara, como que você fez isso?" Tá?

**2:32** · Então, é exatamente o que a gente vai fazer aqui ao longo do vídeo o tempo inteiro. Show de bola, tá? Se você tem um olho mais atento, além desses nós, né? A gente pode chamar isso aqui de nó, nós temos arestas. Do que seriam essas arestas? seriam essas setinhas. Essas setinhas nada mais são do que comunicações que acontecem. Então, acontece uma comunicação entre o modelo e a ferramenta, entre a entrada e o modelo, etc, etc. Nós podemos interceptar essa comunicação entre os diferentes nós em todo momento do nosso ciclo, do nosso agente. A gente sempre pode fazer isso.

**3:02** · E é por isso que eu acredito que o guard re deveria estar aqui e não aqui, tá? E você vai entender. Vamos lá. O que que a gente pode fazer?

### Os diferentes níveis: entrada, ferramenta, saída e HITL

**3:13** · a gente pode interceptar a mensagem na entrada. O que significa? Antes de qualquer mensagem chegar no modelo, a gente pode pegar essa mensagem e fazer qualquer coisa que a gente quer. Por exemplo, verificar se é uma mensagem maliciosa. A gente pode fazer redact da informação. Por exemplo, entra um CPF ali e você não quer que aquilo entre no modelo, né? Você pode ocultar aquela informação e você pode fazer o que você quiser. Se entrar uma uma mensagem maliciosa ou alguém falando, sei lá, um uma palavra que seja indevida, você pode mandar direto pra saída, por exemplo.

**3:45** · Você não pode, precisa nem passar pelo modelo. Você tem todas essas opções.

**3:48** · Você tem a opção na saída também. Por que que você gostaria de fazer algo na saída? Verificar, validar se a saída do teu agente não tem nada comprometedor, né? Então vou imaginar que teu agente faça alguma coisa, ele alucine e ele dá uma resposta indevida. Então você pode interceptar essa mensagem do teu agente antes de mandar pro teu usuário final, por exemplo. E você pode também entre a chamada de ferramenta, tá? Isso aqui é muito subestimado, mas isso é importante principalmente se você tá lidando com ferramentas que você não tem controle.

**4:20** · Vamos imaginar que você tem uma solução que faça busca na internet.

**4:24** · A internet pode te fornecer qualquer informação. Você não quer que uma informação ruim entre no contexto do seu agente, porque vai ser um desastre.

**4:31** · Então você pode botar um guard raio também na chamada de ferramenta. E tem mais uma camadinha que eu vou mostrar aqui no código que é o humano no loop, tá? O que que seria o humano no loop?

**4:42** · antes de o seu sistema, o seu agente tomar uma decisão que de repente é muito importante, você chama um guardio, o guardio verifica se aquela se aquela ação de fato é importante e o teu sistema, o teu agente vai parar e vai pedir a aprovação de um humano, tá?

**5:00** · Então eu vou mostrar tudo isso aqui como que a gente faz. É bem simples, beleza?

**5:04** · Tá?

**5:06** · Se você tá na comunidade, todos esses notebooks aqui, eu só vou mostrar esse cinco aqui, porque ele engloba várias dessas coisas, estão todos lá no no repositório da comunidade, eh, para você acessar. E se tiver quórum suficiente, se tiver eh necessidade, se tiver vontade da comunidade, eu gravo um curso só sobre guardos. Eh, mas esse notebook aqui é um guard rails one on bem bem legal, tá? Então, vamos lá. O que que eu tenho aqui? Esse aqui é o layout do meu gráfo. Então, se você vê aqui, ó, eu tenho modelo e tenho ferramenta.

### Implementando guardrails com LangChain na prática

**5:34** · Todo o resto, como eu falei anteriormente, são guard rails. E esses guard raios t diferentes categorias, tá? E a gente vai navegar entre elas, porque cada um tá preocupado com alguma coisa e tá fazendo alguma coisa diferente. Guardias Ross no mundo real não é um portãozinho só. Você pode fazer vários gates e acumular eles para diferentes funções, tá? Então você pode fazer guarde reios cumulativos, como eu tô fazendo aqui. Vamos dar só uma olhadinha no código para você ter ideia de como isso aqui tá implementado.

**6:04** · Ó, se você ver aqui, eu tô usando o create agents, tem mistério nenhum. Ai, Ronald Lang é muito difícil, pelo amor de Deus, cara. Olha isso aqui, tá?

**6:13** · Create agent modelo ferramentas. A gente vai, eu vou mostrar exemplo de ferramenta. Então, tem uma ferramenta aqui e tem esse cara aqui chamado media.

**6:22** · Algum desses mediors aqui são implementados por mim, então são totalmente customizados, como esse aqui, né? Então tem algumas palavras que eu quero que ele faça guarde reio, que seria, ah, se o cara digitar essa palavra no chat, eu quero bloquear esse cara, por exemplo. Então esse aqui é algo muito customizado. E tem um layer aqui, por exemplo, que é de PII. O que que seria PII? Se você nunca ouviu essa falar essa palavra, são dados sensíveis.

**6:46** · Então, dados sensíveis comuns, e-mail, número de cartão, CPF, né? Qualquer dado que identifique alguém unicamente que possa ser comprometedor. Esse tipo de coisa já existe no LCH, você só precisa importar, é bem fácil de usar, tá? O difícil é entender as ideias e conectar tudo isso, né? Assim, a implementação é cada vez menos é menos complicado, desde que você entenda bem a base, bem as ideias. Show de bola. Então é basicamente isso.

**7:11** · Tem aqui um conjunto de midware, que é onde a gente tá atuando, e o resto é só a compilação do gráfico aqui e a gente vai começar a ver o fluxo normal.

**7:23** · Obviamente eu já rodei tudo aqui pra gente não ficar esperando ele rodar, né?

**7:26** · E aí o primeiro exemplo que eu quero mostrar para vocês aqui é bem simples, de um fluxo normal. Eu tô falando lá aqui, esse aqui é o meu usuário, a gente tá simulando. Se você nunca viu isso aqui, isso aqui é um J Python Notebook, né? Não sei nem se chama assim mais. Eh, muitos anos atrás isso era muito comum da gente usar a galera de dados, a galera de ciência de dados, né? O pessoal foi abandonando ao longo do tempo, mas eu realmente acredito que é ótimo para demonstrar conceitos. Então é por isso que eu tô trazendo para cá, porque é mais fácil da gente ver o detalhe, ver o que aconteceu. Parará, parará, tá? Show de bola. O que que eu fiz aqui? Eu chamei o meu agente. Você tá vendo aqui, ó? Chamei o meu agente.

**8:01** · E isso aqui eu tô pegando só o output do resultado que o agente deu. É só isso. E depois eu tô fazendo um fora aqui para imprimir tudo que o agente fez. E você vê que a decisão do meu guardio foi safe, tá? Lá em cima no meu guardio, eu tenho um guard raio para falar, ó, fica olhando isso aí, a entrada. Se for safe, você dá verde. Se for um safe, você dá vermelho. E tem o meu critério. Eu decido o critério. E dentro do critério, ele deu safe. E você vê que a resposta crua do modelo foi essa aqui. E a resposta que saiu lá do meu usuário foi essa aqui. Então, show de bola.

**8:32** · Esse é um exemplo do caminho feliz, tá? Agora vamos ver o que é legal, né? Quando a coisa quebra, tá? Vamos lá. Primeiro aqui, ó, bloqueio de entrada. O que que é isso aqui, ó? me ajude a hackear o sistema do concorrente. De repente, se você quer ter um certo cuidado paraa sua solução não parecer eh perigosa para o mundo externo, né? Então esse aqui é um exemplo muito simples que você vai bloquear antes de chegar no agente.

### Guardrail para bloquear entrada maliciosa

**9:01** · Então antes de chegar na minha LLM, ninguém vai encostar na minha LLM. Se o cara chegar com esse tipo de malícia aqui, o que vai acontecer no meu sistema é o meu sistema bloqueia antes de encostar no modelo. E aí você vai ver aqui, ó, que guarde raio de entrada acionado. Isso tudo aqui foi uma mensagem customizada por mim. Você tá na comunidade, você pode ver ali o código com calma depois. Ah, mas para título de ideia é basicamente isso. Esse aqui é um filtro muito fácil e eu tô filtrando deterministicamente. O que seria deterministicamente?

**9:30** · Eu crio uma regra dura que se tiver, por exemplo, uma palavra que eu não quero, ele vai ser acionado. E à medida em que ele for acionado, o que eu tô fazendo é mandar direto pro final. Eu tô tirando essa mensagem do loop do agente, tô mandando direto pro último nó e fala assim: "Cara, acabou a conversa, sai daqui".

**9:49** · Tá? Então você pode ser extremo desse jeito e fazer ele não encostar em nada.

**9:53** · Você pode pular do início pro fim sem passar em nada direto com essa técnica aqui. É muito útil, é muito econômica, muito rápida, porque você não chama LM.

**10:02** · E você não tem nenhuma eh outra regra ali perigosa que tenha que avaliar, é só uma palavra. Então ele olha e já manda pra frente do jeito que ele quiser. Show de bola. Tá bom. Cenário dois, né?

**10:14** · Cenário três aqui que eu botei, né?

**10:17** · PII na entrada. O que seria PII? Mais uma vez seria algum dado pessoal de algum usuário. Então você vê aqui no meu exemplo, eu tô usando um e-mail aqui, ó.

### Guardrail para mascarar PII

**10:27** · Tô usando um e-mail, né? Meu e-mail é isso. Parará. Faça um um resumo curto sobre o guardos para usar mais tarde. E aí, mais uma vez, eu tô imprimindo a saída. Você vai ver aqui, ó, que na entrada a minha entrada tá sendo sanitizada. O que significa?

**10:45** · Eu não tô deixando que a minha LLM veja qualquer e-mail. Onde isso é importante.

**10:51** · Por exemplo, de repente você tá usando uma LLM que não é sua, né? você tá alugando uma LLM, assim como eu tô alugando aqui. Eu tô chamando uma API e ela tá respondendo. Você pode implementar isso na sua solução, na sua empresa, de modo que quando alguma mensagem que identifique, por exemplo, pro teu cliente chegar, ele faça redact da informação. Então, o LLM não vai ver informação sobre o usuário. Qual é o cuidado que você tem que ter com isso? Pode ser que a informação do seu cliente seja importante paraa resposta, correto?

**11:21** · Então você vai ter que arrumar jeitos de navegar entre essa complexidade. E aí seria um tópico um pouquinho avançado.

**11:26** · De repente você vai ter que fazer um hash eh desse e-mail antes de chegar ali e tudo mais. O que eu quero dizer é, vamos voltar para cá. É possível você fazer isso aqui antes do modelo. O primeiro eu fiz isso aqui, ó, que a gente viu o exemplo anterior. E esse exemplo é esse cara aqui. Ele bate aqui.

**11:43** · Aqui ele vai passar, não tem nada. Ele chega aqui e ele tá fazendo o redact da informação. Então você vê que eu não joguei informação pro final igual eu fiz aqui no primeiro exemplo, né? Aqui no primeiro exemplo eu joguei logo para para ir embora e aqui eu não, beleza, ele entrou, tem um e-mail, não tem problema nenhum, eu só reescrevo esse e-mail de um jeito que o modelo não veja. Tem diferentes jeitos que você pode fazer isso.

**12:03** · E esse aqui é um exemplo bem básico, mas é muito, muito útil para várias soluções que hoje eu sei, eu sei que você tá me vendo aí, o teu modelo tá vendo chave de API, tá vendo telefone do usuário, tá vendo tudo mais. Se você quer se profissionalizar, se você quer ir para um próximo nível, eventualmente você vai ter que se preocupar com isso aqui em soluções profissionais. Beleza? Vamos pra próxima.

### Guardrail com Humano no Loop

**12:26** · Aprovação humana antes de chamada de tool. O que que é isso aqui? Esse aqui é o famoso humano no loop, tá? Então, se você vê eh alguma sigla como essa aí, ó, Hi, essa aqui que eu não não tá aqui, né? H TL, né, ou algo do tipo, significa humano no loop. O que que é humano no loop? Na prática o teu agente vai funcionar, em algum momento ele vai parar e ele vai pedir ajuda. Você pode pensar também, eu nunca vi essa definição formal, mas eu gosto de pensar que é o humano como ferramenta pro agente, tá?

**12:57** · Então você vai pedir ou seja uma informação pro humano que de repente o sistema não tem ou você simplesmente vai pedir aprovação. No nosso caso aqui a gente vai usar essa técnica como guardil também ou como complemento do guardil. E qual é a diferença? Antes sempre quem decidia é o próprio sistema automaticamente, né? a gente tem regras ali e o sistema decide se vai para frente, se vai para trás, se tá aprovado, se não tá aprovado. O que a gente tá fazendo aqui é pedir uma autorização do humano para prosseguir no agente.

**13:28** · E o que que a gente tá fazendo aqui, ó? O nosso usuário vai lá chegar lá no nosso sistema e falar assim, ó, publica um comunicado interno no canal de engenharia avisando sobre a aula de guarde reios amanhã. Show de bola. Seria uma uma requisição legal, normal. Se você lembra, lá no início eu tinha algumas ferramentas, deixa eu botar para cá. Aqui, ó. Tool. Eu tenho essa T aqui, ó. É exatamente essa TU que ele tá chamando, ó. Tá vendo? A Tool tem qual parâmetro? Canal. Então, qual o canal que ele quer mandar?

**13:54** · Eu tenho título e eu tenho bud, que seria o corpo da mensagem. É basicamente isso. É uma ferramenta MOC aqui que a gente tá simulando, é como se fosse uma ferramenta real, tá? Então é basicamente o que ele tá fazendo é ele, o usuário digitou aquilo, ele vai, ok, eu tenho ferramenta para fazer isso, tenho. Ele vem e chama essa ferramenta. Show de bola. E o que que ele fez aqui, ó? Você vê que ele chamou a ferramenta, chamou a to call. E essa to pode ser qualquer coisa, cara.

**14:19** · Pode ser desde uma ferramenta de e-mail, conexão com banco de dados, qualquer coisa que você quiser conectar e que tem um um método de conectar na internet, né? Uma IPI, qualquer coisa do tipo, qualquer coisa mesmo, desde que você crie uma ferramenta. Beleza? Show de bola. E o que que ele fez aqui? Se você notar aqui, ó, o nosso log, ele tem qual é o canal? É o parâmetro, né? É o argumento da ferramenta, correto? Então aqui, channel, engenharia, title, aviso, barará, bud. A equipe de engenharia será bará barará.

**14:49** · E você vai ver que isso aqui é comum quando a gente fala de humano no loop, esse conceito chamado interrupt. E o que que ele vai fazer?

**14:57** · Ele vai interromper a execução do teu sistema, daquela thread ali que tá acontecendo, e ele vai pedir aprovação aqui. Todas essas aprovações foi eu que defini. Não existe nada eh escrito em pedra. E aí a aprovação aqui são os três tipos mais comuns, são aprovar, editar.

**15:14** · Então, por exemplo, eu poderia editar a mensagem, então vou imaginar que tem, você gera um relatório semanal, esse relatório é crítico, você pede Ll para gerar, só que antes de gerar você quer revisar o o o relatório antes de mandar pra frente, né? Então você pode usar esse tipo de coisa aqui, seria um guard raio, seria uma segurança extra para que você bote LLM para funcionar e você sabe, se você tá aqui no canal, provavelmente você sabe que a IA não é mágica, você sabe que ela comete erros.

**15:40** · Se você entrar em qualquer lugar lá, Google, chat EPT ou cloud, você vai ver lá todos os lugarzinos assim, ó. A I pode cometer erros para lá, só que parece que agora no mundo dos especialistas de parece que a IA virou uma coisa que não comete erros, mas esse não é a verdade. Então isso é uma preocupação legítima de sistemas do mundo real e você precisa ter. Então essa é a técnica humano no loop e é assim que você pode aplicar em em coisas reais, principalmente se você tá lidando com dados. É assim, por exemplo, a galera de direito faz uma solução, ele faz um documento que vai ser enviado para um advogado, para um juiz, sei lá o quê, cara.

**16:11** · Alguém tem, de repente, tem que revisar, de repente é muito importante. Obviamente você pode botar uma outra LLM para revisar e a gente vai falar disso aqui, mas às vezes é importante o humano dar uma olhadinha nas coisas também até de repente se você chegar no nível de confiança ótimo, de repente você pode largar isso e botar apenas a IA para verificar. E esse é o próximo tópico aqui. Vamos lá. Bloqueio de saída. Aqui a gente tá usando basicamente eh bloqueando a saída eh da resposta final, tá? E o que que a gente faz aqui?

### Guardrail para bloqueio de saída

**16:41** · A gente tá usando, deixa eu botar aqui para cima, ó. Deixa eu botar aqui para cima pra gente ver mais uma vez. Então, a gente usou aqui o mano no loop, tá? A gente usou esse cara aqui no exemplo anterior. Então, você vê que o meu modelo processou, o meu modelo chama e esse cara, né? Ele entra ali porque a gente usou a ferramenta. Então, ah, eu tô de olho na ferramenta. A ferramenta chama o humano para verificar. Se o humano der OK, ele vai seguir em frente e vai fazer o que tem que fazer. senão ele vai parar a execução e já era, tá?

**17:11** · Agora a gente vai entrar aqui, ó, no after model. Então, passou por esse, passou por esse, passou por esse, vai parar nesse aqui. Então, vamos lá, tá? O bloqueio de saída, o que que seria o bloqueio de saída? É basicamente não deixar com que o modelo, a resposta do modelo se propague. Ou seja, o modelo respondeu algo que a gente não gostaria e isso pode acontecer, caras, vocês sabem que pode, vocês, eu sei que vocês não estão já no mundo mágico da IA. você sabe que a IA pode responder algo que você não quer ou ela pode te dar uma informação errada.

**17:37** · Por exemplo, se você tá lidando com H, por exemplo, você pode dar o documento certo, aí a gera resposta errada mesmo com o documento certo. Existe método de verificar isso.

**17:47** · Em reg se chama reg corretiva, mas a técnica principal, presta atenção, é botar uma IA para verificar a saída da outra IA. Isso comumente, academicamente, é chamado de LLM as a judge, tá? Então, a gente usa essa técnica aqui no guardeio para verificar a saída da do nosso modelo e garantir que não tem nada estranho ali, tá? Nesse caso aqui, eu botei ele para verificar eh esse nome aqui, credencial interna, e ele vai ver e simplesmente vai negar.

**18:14** · E aí você vê aqui, ó, a resposta final continua, eh, continha conteúdo sensível. Antes que você se pergunte, obviamente, se você tá usando LLM adjud, você precisa de um modelo pro teu agente, né? e um modelo pro guardio.

**18:31** · Existem diferentes modelos, existem modelos treinados especialmente para fazer guard rail. Eu até compartilhei aqui, tem na Rock Pro também, tem um grafo lá usando o modelo da Open Ai, que a época era free. Eu recomendo você dar uma olhadinha lá. Eu não sei se ainda tá free, mas virtualmente você pode usar um modelo barato, tá? Um modelo qualquer específico para avaliar uma saída, tá?

**18:53** · Então, qual tipo de saída você pode avaliar? Você pode avaliar se a saída eh tem alguma palavra que não deveria, se ele tá tendo um comportamento que a sua empresa não aprova. Tudo isso tá tem que tá alinhado com o que tua empresa faz.

**19:04** · Então, obviamente isso é um trabalho de engenharia de ar que vai muito além do oba oba. É o trabalho do dia a dia e é o trabalho do dia a dia que as empresas estão procurando. Gente que sabe fazer isso, gente que sabe construir isso e, principalmente gente que sabe pensar soluções de ponta a ponta. Esse aqui, vai, voltando para cá, esse aqui é um pequenininho eh componente disso aqui, né? E aí você vê como esse nosso mundo ele é eh amplo, eh pode ser complexo, né?

**19:32** · Então assim, você não começa com uma solução perfeita do dia paraa noite e ok, mas você precisa caminhar para um dia ter a solução perfeita ou próxima de perfeita e dentro da solução perfeita, guardeios é innegociável. Espero que esse vídeo tenha sido útil para você. que você tem aprendido bastante coisa. Membros da comunidade, baixa o baixa o notebook, discute lá, a gente troca ideia. E é isso. Foi bom vê-los novamente. Abraço e até a próxima.