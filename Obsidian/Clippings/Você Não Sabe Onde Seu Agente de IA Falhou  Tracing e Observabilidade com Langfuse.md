---
title: "Você Não Sabe Onde Seu Agente de IA Falhou | Tracing e Observabilidade com Langfuse"
source: "https://www.youtube.com/watch?v=OpO9z12XgOk"
author:
  - "[[Ronnald Hawk]]"
published: 2026-05-21
created: 2026-05-24
description: "––– Recursos & Educação –––Comunidade (Engenharia de IA de verdade)  https://www.rhawk.pro/comunidade  –––Serviços–––https://www.rhawk.pro/empresas––– Descri..."
tags:
  - "clippings"
---
![](https://www.youtube.com/watch?v=OpO9z12XgOk)

## Transcript

### O agente vai falhar

**0:00** · cá entre nós. Se você já colocou um agente de A em produção, ele falhou.

**0:04** · Seja porque ele não chama uma ferramenta quando deveria chamar, seja porque ele inventa uma resposta que não deveria estar lá. Mas acontece que isso é comum e aceitável para a primeira versão. O que não é comum nem aceitável é empurrar isso debaixo do tapete, fingir que nada tá acontecendo e continuar falando que a IA é mágica. Nesse vídeo aqui eu vou falar sobre tracings e observabilidade.

**0:28** · E você vai entender como transformar esses erros em ferramentas de melhoria para sua solução. Eu vou te mostrar com uma ferramenta aqui chamada Leng Fuse, que eu tenho usado tanto para mim quanto para os meus clientes. Eu sou o Hulk. Eu ajudo indivíduos e empresas a colocarem soluções G em produção e lucrarem com isso. Se você tem interesse em entrar em contato, links estão na descrição.

**0:49** · Recusitações. Bora pro vídeo. Nós estamos num momento muito interessante da indústria. Há dois anos atrás, mais ou menos, era um certo mistério como colocar uma solução de a em produção. E quando digo em produção é com seu back end, com seu front end, com a sua IPI, etc. O que existia era basicamente low code ou no code. E as pessoas que insistiram nesse caminho ou perderam competitividade e abandonaram o mercado ou tão tentando ou migrando para código, tá? Só que aí veio o vibe code, tá?

### Produção é o começo da vida real

**1:17** · E esse é um conceito importante que eu quero que você preste atenção desde já, porque isso vai impactar em tudo que eu vou falar daqui pra frente. O vibe coding seria a ocupação de gerar código usando IA. Beleza? legítimo, tem problema nenhum. E é inevitável que todo mundo use por conta da velocidade. A gente vai entrar em questões de qualidade, etc, etc. Não vem ao caso aqui, mas é uma grande é uma grande um grande acelerador, faz parte.

**1:46** · Só que do outro lado existem pessoas que estão criando aplicações com o IA no centro. A IA faz parte da aplicação e você fornece isso. Então, de um lado existem os consumidores de ferramentas prontas e do outro lado existem pessoas que estão produzindo ferramentas para outras pessoas usarem. O que eu tô falando aqui e essas técnicas que eu tô falando é pra galera que tá produzindo.

**2:09** · Eu sei que minha audiência aqui é altamente qualificada, mas vale a pena ressaltar isso aqui para não existir confusão em nada do que eu vou falar daqui pra frente. E o que que eu quero dizer com produção é o começo da vida real?

**2:22** · Engenharia de A, ainda se tem a ideia em vários lugares que criei um agente na minha máquina, eu sou engenheiro de A, não é isso, tá? Engenharia de A vai muito além do próprio agente. Existem várias coisas ao redor de um agente que um engenheiro de A tem que se ocupar e saber. E esse é um dos grandes filtros, porque muita gente tem a ideia inicial de, e a gente tinha muito isso, né, um ano atrás, é, vou aqui com clique ficar rico. E pouca gente consegue executar, porque pouca gente tá disposta a pagar o preço da execução.

**2:52** · E o que seria essa execução, tá? Esse aqui é um gráfico eh do do Hype, do ciclo do Hype, e eu gosto de trazer ele sempre para nos dar eh uma referência aqui interessante, tá? Se você notar tanto esse slide quanto esse aqui, a gente tem essa ideia, digamos assim, do tempo, né? E a execução ela requer tempo. E o que acontece na nossa indústria?

**3:18** · E ainda tá acontecendo, tem muita gente que ainda tá aqui, tem muita gente que já quebrou a cara e começa a entrar aqui. E tem gente como que tá aqui, tá vindo para cá, obviamente, sempre tentando melhorar, tá? Esse é um ciclo, nem todo mundo tá no mesmo ponto, mas é um ciclo geral. E o que acontece que para você chegar no platô de produtividade, isso requer tempo. E nesse tempo você vai ver erros infinitos, tá? Erros. Você vai ter um dia com mais erros do que acerto.

**3:49** · Isso é normal. É assim que um agente de A vai funcionar no mundo real. A realidade, apesar de eu estar na internet, né? Você tá me vendo na internet aqui, a realidade do dia a dia é diferente do que vai aparecer no mundo colorido de alguém que fala de i e não faz, né? ele vai falar que tudo funciona maravilhosamente bem, que ele substitui a equipe toda, aquela coisa toda, mas a realidade é muito mais trabalhosa do que parece.

**4:15** · E é exatamente por isso que você quer estar nessa área, porque enquanto a grande massa fala assim: "Eá para trabalhar menos". A gente sabe que a gente vai trabalhar mais, mas é exatamente por isso que a gente vai ter sucesso, porque tem pouca gente disposta a trabalhar de verdade. Muito bem. Só um adendo aqui antes de eu avançar para você, meu amigo aí que tem agência de a consultoria, o teu melhor cliente tá aqui, ó. Tá? Vou te dar logo esse spoiler. Ele tá aqui. Ele tá saindo da fase de desilusão e tá entrando aqui na fase do Ele tá começando a entender o problema.

**4:48** · Geralmente esse cara já tentou alguma coisa e ele tá começando a ficar desiludido. Então se você tiver um prospecto bem aqui, esse cara é um bom lead para você, cabe a você qualificar ele. Você deve qualificar o seu lead, assim como ele te qualifica. Não trabalhe com qualquer um, senão você vai perder seu tempo, tá?

**5:04** · Se esse cara tiver nesse pico aqui e você fosse realmente um cara bom, e como eu falei, a minha audiência aqui é composta de da galera que é muito boa. É, se o cara tiver nessa fase aqui, não vai ser um bom cliente, tá? porque ele vai ter expectativas de que tudo vai funcionar em um mês e ele vai te pagar R$ 1.000 e pronto. Então esse cara que tá aqui e que vai persistir são as empresas que vão prevalecer nessa era, eh, e elas são boas de trabalhar, mas outras elas vão, enfim, ficar para trás com novas empresas que entenderem como usar IA de verdade. Beleza?

**5:34** · Dito isso, nós temos que usar o erro como professor, o erro como ferramenta de melhoria, eu gosto de chamar assim, tá?

**5:43** · E o que que eu quero dizer com isso?

### O erro como ferramenta de melhoria (observabilidade)

**5:46** · Quando a gente cria uma solução normal, né, por exemplo, uma IPI, a gente consegue prever o caminho que ela vai percorrer, né, em última instância, se isso para cá, se aquilo para lá, né, é a natureza dos sistemas eh que você consegue determinar antes.

**6:04** · Só que a gente tá lidando com LLM e há dois anos atrás a LLM era muito simples em muito dos casos. A gente tinha uma entrada chamava LLM saía. Aí a gente começou a botar ferramenta, começou a ficar complicado. Aí começamos a, por exemplo, criar workflows customizados.

**6:22** · Aí começa a ficar um pouco mais complicado. O padrão hoje é o React Agents. Eu já mostrei aqui várias vezes, procura aí no canal, tem lá no Rock Pro também. E basicamente é uma LLM com acesso a ferramentas.

**6:37** · E essa ferramenta não precisa ser uma ferramenta, podem ser várias ferramentas. Então a gente tem liberdade total para tomar uma ação, né? ele procura o que ele acha que ele tem que fazer, ele faz. Então você vê que esse é um caminho delicado e é exatamente assim que muit das vezes se parece um caminho de execução do agente. O usuário faz a pergunta, às vezes se o contexto tá grande, ele compacta.

**7:00** · Se era uma pergunta relacionada a reg, esse aqui é um exemplo de ha. Ele vai lá fazer o retrieval, ele chama uma ferramenta, ele faz um monte de coisa lá, ele retorna a mensagem, ele gera resposta e ele traz a resposta final. Um erro comum em todo mundo que tá começando e fazendo solução, faz a pergunta, saiu a resposta, é aquilo que ele avalia. E obviamente isso vai dar erro no meio do caminho e a o método de avaliação vai ser sempre a resposta tá errada.

**7:30** · Mas se você não consegue ver o caminho que o teu agente percorre, infelizmente você nunca vai saber de fato o que você tá fazendo. E aí você vai pra adivinhação. Ah, eu acho que é isso. Eu acho que é a busca que não tá boa. Eu acho que é o prompt. E aí você vai ficar andando em círculo, em círculo, em círculo, até que vai chegar o momento em que você vai dizer que a IA não funciona e você vai abandonar o barco, tá? O caminho para isso é abraçar o erro, né? O erro tá lá, ele vai acontecer.

**8:04** · E eu falo aqui constantemente, cara, o erro vai acontecer e tudo bem, o cabe a gente, nós como profissionais, tirarmos proveitos desse erro. Porque é exatamente aqui, ó, se você vê esse gráfico aqui, ó, por que que as pessoas elas têm muita eh expectativa e de repente elas têm muita desilusão? Porque existem vários erros. Quem tirar proveito desses erros é que vai sair vitorioso dessa corrida.

**8:31** · E é isso que a gente tá fazendo aqui no canal. É isso que eu tô mostrando aqui publicamente para vocês, como eu tenho feito, como a indústria tem feito. E eu vou chegar já nisso. E como você pode fazer, seja se você tem uma empresa, seja se você é um profissional. Se você é um profissional que sabe fazer isso, você tem valor no mercado. Muito bem. Tá.

**8:51** · Qual é um componente muito importante disso? Você já deve ter ouvido a palavra observabilidade quando a gente tá falando de soluções de soluções computacionais, né? Você tem a observabilidade do servidor. O que acontece no seu servidor? quando o usuário loga, quando manda uma mensagem, quando salva um arquivo, etc, etc. Para as soluções de a, nós temos, digamos assim, a própria camada de observabilidade. E um dos componentes centrais nessa camada se chama tracing, tá?

**9:19** · E o tracing nada mais é do que seria o raio X da execução do que aconteceu ali com o teu agente, com a sua solução de A. Sem esse raio X, você só vai adivinhar para sempre, OK? e duas ferramentas. Tem duas ferramentas muito famosas que nós podemos usar para ver esses tracings, tá? Eu várias vezes já falei de L Smith aqui e já mostrei ele em funcionamento em algumas vezes, só que de um ano para cá, se meses para cá, eu passei a usar o Leng Fels.

**9:48** · Pelo seguinte, o Legmão, nesse exato momento ainda é melhor que o Lang Fels, só que ele tem um porém.

**10:00** · até certo número de tracing, ele é gratuito. Então você só passa a IPA aqui, principalmente se você tá usando L chain. É bem simples de usar o Leng Smith, bem simples mesmo. Você pode começar com ele e eu recomendo você começar com ele, na verdade, só que quando você chegar num limite, ele vai começar a te cobrar e ele vai te cobrar por acento. O que que seria isso? Ah, eu tenho dois desenvolvedores aqui na minha empresa ou ten duas pessoas trabalhando no projeto.

### Tracing: o raio-x do agente

**10:26** · Então ele vai te cobrar por dois assentos. Então você tem três. O que acontece é que eu tô num ponto agora em que meus projetos já cresceram. Então bancar o Lengsmith pode ser um inconveniente, mas por outro lado, se você pensar que você não vai ter que gerenciar nada e tudo vai para lá, é legal. E eles têm coisas bem legais lá que eles já preparam, obviamente, porque é um produto deles, eles têm que fazer o produto bom. É um bom produto, então você pode usar ele tranquilamente, tá?

**10:52** · Só que o L fuse é uma alternativa open source para isso. Ele se propõe a fazer coisas bem parecidas e eu não vou entrar em detalhe da diferença entre um e outro. O importante é o tracing. A ideia do tracing é a mesma. O que eu costumo dizer é foca no conhecimento, esquece a ferramenta, a ferramenta passa, o conhecimento fica. Tá bom? Então, como Leng Fuse é algo open source, é interessante pra gente, principalmente estudar e eventualmente criar uma solução, indicar para algum cliente, instalar num cliente, etc, etc, etc.

**11:24** · Show de bola. Então, o que que eu quero dizer com Leng Fuse? Eu vou mostrar ele aqui. Eu tô com uma conta teste. Deixa eu fechar esse cara aqui porque tá uma bagunça. Deixa eu fechar esse cara aqui, tá? E essa é a cara do Leng Fuse. Quando você vê ele aqui, eu tô usando uma aplicação demo deles, tá? E aí você vai ver essa cara aqui que para muitos de vocês que nunca viram pode ser confuso, mas não tem nenhum mistério. E eu vou te mostrar aqui o bem básico do que é um tracing, tá? O que que é um tracing? O tracing, ele vai ter uma data, uma data de execução. De execução do que, Ronald?

**11:55** · O tracing é a execução de quando alguém chama o teu agente, por exemplo, alguém falar: "Olá", o agente vai e vai dar resposta. Isso vai gerar um tracing. E o tracing tem start date, né? Quando o tracing começou, o tracing tem um input, que seria a pergunta que a pessoa fez, e o trace tem um output, correto? Só que aqui, quando a gente clicar, você vai ver que ele não tem só essa entrada e a saída, né?

**12:24** · Ele vai ter todo o percurso que o teu agente fez para chegar àquela resposta. É aqui que tá o nosso ouro, cara. É aqui que tá o segredo. É aqui que todas essas empresas, se você acompanha a indústria mais de perto, estão brigando. Todas elas estão preocupadas em melhorar a qualidade da sua harness. E todas elas fazem isso através disso aqui que eu tô mostrando para vocês. É isso aqui que a indústria tá fazendo. Ela coleta esse tracing, ela entende esse tracing e então ela melhora o produto.

**12:56** · Eu vou mostrar esse ciclo já já para vocês, mas antes eu tenho que te mostrar o próximo conceito que é muito importante aliado a esse aqui, que são as sessions, tá? Então a gente viu o tracing aqui e ele parece um pouco bagunçado, né? É bem difícil de ver.

**13:09** · Então você vai lá imaginar que na minha plataforma eu tenho 500 mensagens por dia. Como que eu vou analisar esse tracing? O que vai acabar acontecendo é que isso aqui vai ficar jogado aqui para sempre. Ninguém nunca vai ver. Eu nunca vou tomar nenhuma atitude em relação à melhoria do meu sistema, porque eu não tenho tempo de ver porque vira uma massoca de dados infinita. Então a gente pode ver isso de uma maneira mais interessante, que é o session. O que que é o session? É basicamente uma agregação dos tracings em uma thread. O que que é uma thread? O que que é isso?

### Sessions e anatomia de um trace

**13:37** · Você vai lá no chat apt, você fala nova conversa, aquilo é uma thread. Então a gente pode agrupar, né, agregar os tracings baseado em uma trades casos a gente vai ter uma visão completa do que aconteceu numa sessão. E isso é ótimo para você entender o comportamento do teu agente e o comportamento do teu cliente para você ser proativo e então tomar as decisões corretas antes de qualquer coisa, tá?

**14:05** · Antes de tomar uma decisão no achismo, você pode usar esta ferramenta aqui.

**14:09** · Isso é teu amigo. Se você ainda não tem, já colocou uma solução de produção em a, não adiciona outra feature no seu agente, não adiciona outra ferramenta para e faz isso agora, tá? Senão você vai criar um débito técnico enorme. Você já tá criando, se você já tá assim, tá?

**14:22** · Mas tá na hora de parar, porque isso não vai te levar longe. Vai criar burnout em quem trabalha com você, ou se é você que tá trabalhando. Você vai arrastar um monte de problema e uma coisa em uma hora vira um castelo de carta e cai, tá?

**14:34** · É inevitável. Show de bola. Ah, R, porque você tá falando isso? Existe um padrão de empresas que t sucesso e existe o padrão das empresas que não tm sucesso.

**14:45** · Ambas as empresas têm ideias.

**14:47** · Ambas as empresas, muitos casos têm dinheiro, mas uma tá disposta a adotar o que funciona na indústria, não na indústria fictícia da internet, mas na indústria internacional, tá? O que as pessoas que botam e a gente em produção tão fazendo e as outras acham que isso é besteira. Então, cabe você decidir o que você quer fazer, tá? Anatomia de um tracing, eu queria tirar de lá porque é um pouco difícil de ver se você de repente tá vendo na tela do YouTube aí, tá? O que que eu tenho aqui, ó? Você vê que o tracing é aquele conjunto, né, de coisas que eu mostrei.

**15:18** · E aí eu tô te dando um exemplo aqui de coisas reais, né? Então o usuário pergunta sobre data de entrega, ele fala quanto que vai entregar aqui minha televisão, né? Você tem de repente um nó para classificar intenção. A gente pode fazer isso com L graph, por exemplo, usando um router.

**15:33** · Ah, classifica intenção. Beleza.

**15:36** · Informações, tá? manda para uma ferramenta, ele busca sobre a política de entrega, chama uma ferramenta que vê o status do pedido, gera resposta. Se algo aqui, por exemplo, se essa resposta ao usuário tivesse muito ruim, se ela tivesse louca, se ela não tivesse nada a ver, você sabe exatamente o que acontecer ao longo do tempo. Isso é o raio X de um agente de A. É assim que funciona. Obviamente esse exemplo aqui é muito simples.

**16:02** · Se você tá colocando soluções de A em produção, você vai ver que, cara, às vezes em uma chamada, dependendo da complexidade do problema que o teu agente tá resolvendo, ele vai fazer oito chamadas da ferramenta, ele vai entrar em lugar que não que não deveria entrar. E é aí que você vai começar a melhorar, né? Por exemplo, um caso clássico é deixar o agente chamar a ferramenta livremente, né? De repente você tem que botar um budget na chamada de ferramenta, limitar, cara. Chama cinco ferramentas no máximo. Se você não conseguir, volta pro usuário e pede mais informação.

**16:32** · Isso são coisas básicas, mas você só vê depois que você tiver experiência e depois que você começar a ver tracing, você vai começar a ver padrões repetidos de problemas. E aí você vai de antemão, muita das vezes, por exemplo, hoje quando eu crio uma nova solução, por já ter visto vários traces na minha vida e vários padrões, eu já sei de antemão que tente já dar problema. Então eu já antecipo, mas certas coisas só com a experiência daquele agente que você tá fazendo, não tem muito o que fazer, tá? Então como?

### Do trace ao eval

**17:03** · Como que você faz isso aqui, cara? Tá sem teoria. Primeiro você aprende a fazer um agente colocar ele no A. O que é colocar no A? Sua infraestrutura, seu dado, tu LLM e de preferência com Eval. Eu tenho esse vídeo aqui sobre Eval, onde eu mostro um EVAL básico. O que seria um EVA básico, você vai criar sua solução e não é, eu acho que ela tá boa. É com base nesse dataset aqui, mínimo que eu criei, mínimo. Tudo bem, isso é mínimo no início.

**17:31** · O teu agente não vai ser bom de primeira, não vai ser bom de segunda, não vai ser bom de terceira. É um processo evolutivo. Vou voltar para cá mais uma vez. É um processo de execução e é aqui que você vai ter sucesso. A maioria vai vir aqui, vai criar um agente, vai falar que é engenheiro de a especialista em a, mas eles não estão dispostos a executar, eles não estão dispostos a passar no teste do tempo. Você precisa passar no teste do tempo. A sua solução precisa passar no teste do tempo. É um processo natural. Alinha a sua expectativa com a realidade.

**18:03** · Se você ainda tem a expectativa que vai ficar rico com o clique, não vai, cara. A realidade exige execução e melhoria contínua. Show de bola. Fez isso. E esse aqui é o ciclo que eu chamo. Eu nem chamo de nada, não sei o nome, não sei se tem uma definição clara para isso, mas presta atenção nesse ciclo aqui.

**18:24** · Criou ali. Beleza, Roland, coloquei em produção. Graças a Deus. Show de bola. É o primeiro passo. É o primeiro passo.

**18:30** · Você chegou. É Hello World. Chegou no mundo, tá? Cheguei. Tô agora. Eu tô participando da brincadeira. Você nunca colocou em produção, você ainda não tá no jogo. Sinto muito, tá? Tem que colocar em produção, porque tem lições que você só vai aprender depois você colocar em produção. Ron, mas eu não tenho cliente nenhum. Coloca em produção para você mesmo. Passa a usar sua própria solução. É assim, porque você vai ver, cara, por que que tá lento? Por que que ele não responde direito? É assim que você vai, cara. Cria um botezinho para você, bota em produção com a sua infraestrutura. Para de usar low code, no code. Já foi. Isso aí é muito 2023. Show de bola. Tá bom.

**19:05** · Quando você colocar em produção, ele vai produzir esses tracings que eu mostrei ali. Então você escolhe usar o Lengsmith ou o Leng Fuse. Existem outras opções.

**19:13** · Deixa eu voltar para cá. Existem outras opções além dessas ferramentas aqui.

**19:17** · Existem ferramentas de observabilidade tradicionais que tentam fazer isso aqui.

**19:23** · Só que os problemas de LLM são muito específicos. E essas ferramentas aqui nasceram para resolver o problemas de LLM. Então, de repente você quer usar uma ferramenta que é especialista nisso.

**19:33** · Então, é por isso que eu mostrei elas aqui, tá? Mas se você quiser usar outra, garanta que você consiga ter traces decentes, OK? Teve o trace, show de bola. Você vai estudar o tracing, tá?

**19:46** · Você vai ver um padrão de falha. Por exemplo, outro dia aqui eu vi um padrão de falha, claro, eu tenho uma um dos agentes que faz busca na internet, tempo real. O cara digita lá, se o agente achar que tem que fazer uma busca na internet, ele faz. Essa ferramenta aceita o parâmetro do tipo de busca.

**20:01** · Eventualmente meu agente inventava um parâmetro e dava erro. E o erro não era nem elegante, o erro era tipo assim, ele só não respondia, né? Horrível, né? Eu só sou, eu só consegui ver isso porque foi a primeira vez que eu usei essa IPI de buscar internet. Eu não sabia de certos detalhes ali, eu não tinha como prever, só que eu vi esse padrão de falha. Então, toda vez que o cara eh chama essa ferramenta, não toda vez, que às vezes funcionava, mas eventualmente na chamada de ferramenta tinha um problema, não era um problema de conexão, não era um problema de API, era um problema de parâmetro.

**20:32** · Esse padrão de falha você vai identificar, você vai pegar o dataset, como eu falei nesse vídeo aqui, e você vai expandir aquele dataset. Então, aquele dataset começou com 10 perguntas e respostas.

**20:43** · Agora você já viu um padrão em quebra você, cara, quando o cara pergunta isso aqui, eu tenho problema. Então você vai adicionar esse cara ao teu dataset, tá?

**20:52** · Adicionou esse cara ao teu dataset.

**20:54** · Você vai rodar o teu evaluator. Você vai ver, ah, beleza, é isso mesmo, tá quebrando. Você vai fazer experimento, tá? Como que eu resolvo isso? De repente é trocar um prompt, de repente é trocar a estrutura da ferramenta que você fez, tá? Esse experimento é interessante porque a partir de agora você tem que continuar passando nos testes que você fez anteriormente e você tem que garantir que o novo passa.

**21:15** · Um erro comum é identifiquei o erro, corrige o erro, só que agora você tem a síndrome do cobertor curto, que é o novo problema é resolvido, mas você gera um novo problema num dataset. Por exemplo, a pergunta que sempre passava agora para passa de pass para de passar.

**21:33** · Você tem que ter atenção nisso. Isso se chama regressão, tá? Então você não quer regressão. Você vai cuidar para que não tenha regressão e que o novo problema que você identificou passe, obviamente.

**21:44** · Mais uma vez aqui, ó. Vou voltar para cá.

**21:47** · execução. Isso dá trabalho. Isso é um trabalho full time. Isso aqui não é brincadeira. E é por isso que eu tenho certeza absoluta que vocês caras que estão aí trabalhando, eu sei que tem vários de vocês aí que são muito sérios e trabalham, vocês vão ter sucesso. É inevitável, já estão tendo, na verdade, né? E é por isso, cara, que essa área é maravilhosa, porque tem muita gente falando, muita gente falando e muita gente, poucas, pouquíssima gente fazendo, pouquíssima. E você vê claramente que pouquíssima gente faz que muitos deles nunca nem ouviram falar em tracing, né?

**22:16** · Então você entra numa roda de conversar de A e aí você pergunta assim: "Tá, cara, mas onde você tá guardando seu tracing?" Aí o cara quê, né? Nunca vou falar. Então, existe uma separação grande agora acontecendo. Ela não é eh evidente para a população, para a massa, mas eu tenho certeza que quem tá trabalhando consegue ver, consegue identificar quem é de verdade, quem é de mentira. Então é isso, rapaziada. Eh, e meninas também, né? Eu sei que tem meninas aqui eventualmente me vendo.

**22:46** · Então, abraço para vocês. Mais uma vez um prazer em reviê-los. Se você não tem trace no lugar ainda, coloca isso como prioridade aí no teu workflow, na tua empresa. Se você for fazer o leng fuse, vai dar um pouco de trabalho para instalar. você vai conseguir botar numa VPS simples, tudo num docker container, mas no Docker Compose, né, você vai, porque eles são vários serviços ao mesmo tempo, mas é, se você tá rodando algo com muito fluxo, de repente você vai ter que fazer e uma instalação um pouco mais complexa, usando cubernetes, etc. Se você quiser facilidade e comodidade, vai pro Langsmif, sucesso.

**23:19** · De repente, você bota isso aí como uma coisa que você quer trocar no futuro. Eu já fiz várias vezes de começar com Life e começar a fazer a migração, eh, meio que assim um hot swap, né?

**23:32** · Então eu tenho os dois rodando ao mesmo tempo, depois eu mato o L Smith e fico com Leng Fuss. Isso não vai te atrapalhar, dá para você fazer. O Leng Fuse tem outras coisas aqui como e evalo.

**23:43** · E porque eu recomendo para você começar, mas não para você ficar porque as evalus aqui são limitados, mas em tracing ele brilha. Então cai fundo é uma ferramenta só. Você pode rodar em tua máquina, começar a brincar hoje, começar a entender, calcular os custos de instalação, manutenção, etc, etc. e comparar com Leng Smith e decidir o que é melhor para você e paraa sua empresa.

**24:02** · Beleza, gente? Valeu, abraço.