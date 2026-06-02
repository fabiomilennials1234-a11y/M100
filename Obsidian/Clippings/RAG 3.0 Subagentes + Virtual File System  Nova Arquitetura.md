---
title: "RAG 3.0: Subagentes + Virtual File System | Nova Arquitetura"
source: "https://www.youtube.com/watch?v=hgLpzI85-cs"
author:
  - "[[Ronnald Hawk]]"
published: 2026-03-10
created: 2026-05-24
description: "––– Recursos & Educação –––Comunidade (Engenharia de IA de verdade)  https://www.rhawk.pro/comunidade –––Serviços––– https://www.rhawk.pro/empresas––– Descrição –––Neste vídeo você vai entender"
tags:
  - "clippings"
---
![](https://www.youtube.com/watch?v=hgLpzI85-cs)

––– Recursos & Educação –––  
Comunidade (Engenharia de IA de verdade) https://www.rhawk.pro/comunidade  
–––Serviços–––  
https://www.rhawk.pro/empresas  
  
––– Descrição –––  
Neste vídeo você vai entender a evolução completa do RAG e aprender a técnica mais avançada da área usando Virtual File System com subagentes — a mesma arquitetura utilizada pelo Claude Code e pelo Codex. Você vai ver na prática como criar um sistema de arquivos virtual com backend em banco de dados, como um agente principal delega pesquisas para um subagente usando comandos de filesystem.  
  
Você também vai entender as diferenças reais entre RAG 1.0, 2.0 e 3.0, quando usar busca híbrida com reranking, como escolher o modelo certo para chamada de ferramentas, e como equilibrar qualidade de resposta com custo de operação em produção. Para desenvolvedores e profissionais que querem construir soluções de IA corporativa de verdade, com foco em resultado e viabilidade financeira.  
  
  
––– Playlist –––  
Playlist IA: https://www.youtube.com/playlist?list=PLk6saMUFiINn0Y0CnynRthzCCC6e-juJY  
  
  
––– Capítulos –––  
00:00 Introdução  
00:24 Explorando a implementação e o file system  
03:34 RAG 1.0 vs RAG 2.0 vs RAG 3.0  
08:51 Explorando busca com subagentes + Virtual file System  
16:35 Quando usar cada geração de RAG  
  
––– Social –––  
Instagram: / rhawk.pro  
Linkedin: https://www.linkedin.com/in/ronnald-hawk/  
  
#agentesia #rag #engenhariadeai

## Transcript

### Introdução

**0:00** · Ha é um dos assuntos mais importantes quando a gente fala de a corporativa. E apesar de muito importante, esse é um dos assuntos mais mal compreendidos. Se você ficar até o final do vídeo, você vai aprender uma nova técnica com o Virtual File System e vai ter o poder de comparar essa técnica com as outras e decidir qual é melhor paraa sua solução.

**0:18** · Eu sou o Hulk, eu crio soluções de a, coloco em produção e lucro com isso.

**0:22** · Bora pro vídeo. Então, vamos embora aqui pra solução. Já vou fazer uma quer aqui, perguntar quais documentos você tem acesso, tá? E aí eu vou explicando esse agente aqui ao longo do tempo. A gente vai ver que ele vai chamar ferramenta, ele vai listar os documentos e eventualmente ele vai responder pra gente, correto? Você vê que foi tudo muito rápido, você vai entender como isso tá implementado e como isso tá feito e como que ele tá usando o ls, tá? Mas antes de eu entrar daqui paraa frente, é um recado claro.

### Explorando a implementação e o file system

**0:51** · Existem dois tipos de pessoas nesse mundo de agora. As pessoas que entenderam o jogo e estão se adaptando e as pessoas que acreditam que é mágica.

**1:00** · que acontece magicamente, você fica rico. Se você tá no segundo grupo, esse vídeo não é para você. Você tá no primeiro grupo ou quer entrar no primeiro grupo, fica aqui que você vai aprender um monte de coisa. Beleza?

**1:10** · Então vamos lá. O que que aconteceu aqui? Eu fiz uma query aqui, né? Uma pergunta, né? Isso aqui é um chat, tem um agente aqui por baixo, vou mostrar para vocês, mas pensa nisso aqui como um agente. Ele poderia estar no WhatsApp, ele poderia estar no Telegram, ele poderia est onde você quisesse. Beleza?

**1:27** · Tá? E eu perguntei quais documentos ele tem acesso. Beleza? E aí você viu que ele deu um LS. E se você não é familiar com isso aqui, eu vou te mostrar já já.

**1:36** · E ele listou um PEF. O que que é um PEF?

**1:38** · É um caminho, é um lugar, correto? É um lugar no teu computador, por exemplo, correto? Ele chamou novamente a ferramenta aqui, como você tá vendo, e ele listou todos os documentos que ele tem acesso, tá? Provavelmente você tá achando isso aqui familiar com o cloud Code F. E é exatamente essa técnica que eu vou mostrar para vocês. Só que ao invés de rodar localmente na tua máquina, você pode rodar, por exemplo, um Virtual File System num banco de dados ou até mesmo num bucket S3 e coisas do tipo. Legal, né? Tem pros e contas, eu vou te mostrar, mas tem muitos prós, tá?

**2:09** · E aí ele foi lá e me respondeu corretamente. Você viu que ele obedeceu exatamente o que eu pedi e me trouxe a resposta. A gente vai olhar isso em detalhe, mas eu preciso te mostrar algumas coisas para você entender o que tá acontecendo aqui, tá?

**2:23** · Obviamente eu tô usando o LC Chain aqui e esse aqui é o a plataforma de desenvolvimento e é assim que se parece.

**2:29** · A gente vai entrar em detalhe aqui.

**2:31** · Beleza? Beleza. Tá. Deixa eu mostrar aqui para você, se você não conhece o file system, só para te clarear, file system é isso aqui, ó. Quando a gente tem um sistema de arquivos, você tá vendo aqui no meu terminal, é você tem uma série de comandos, como esse aqui, ó, ls, né? LS. Ele me dá ali o que eu tenho de arquivo. Vamos imaginar que se eu quisesse, por exemplo, ver o que eu tenho em doc, tá? Só para vocês terem ideia, se vocês virem aqui em docs, tem exatamente esses docs aqui. Só que os docs que a solução tá mostrando, vamos voltar para cá, eh, os docs que a solução tá mostrando não são aqueles lá.

**3:03** · Você vê que tá um PEF diferente, né? O que que eu fiz? Eu criei um sistema de arquivo virtual, peguei esses arquivos aqui e joguei eles lá. Então, ele não tá olhando diretamente dessa pasta, ele tá olhando de um sistema de arquivo virtual. Beleza? E virtualmente esse sistema de arquivo virtual poderia ter um back end como um banco de dados, como eu falei, e um bucket S3. Então imagina as possibilidades, tá? Vamos ver agora como isso é implementado, né? E eu vou continuar aqui nos exemplos, n? Vamos para cá, né? Eu quero te mostrar isso aqui por o título daí tá aí, reg 3.0, tá? E esse é de fato um novo método.

### RAG 1.0 vs RAG 2.0 vs RAG 3.0

**3:35** · Ronald, mas eu faço curso de engenharia de A e eu nunca vi falar nisso.

**3:39** · Obviamente você nunca ouviu falar nisso, né, cara? Porque isso é novo e geralmente o mercado tá há seis meses atrás, um ano do que eu mostro aqui, geralmente, né? Assim foi com a a reg híbrida, que tem um monte de pessoa que ainda nem ouviu falar, na verdade, tá?

**3:53** · Então vamos eh diferenciar um do outro aqui, só para você se localizar na história onde você tá e que na verdade todos esses tipos de reg aqui, esse um, o 2.5, ambos têm aplicabilidade, tá? Não não são de jogar fora, não. Então vamos lá. O que que a gente vai fazer aqui? O que que eu tô fazendo? Primeiro é se você já viu esse padrão aqui, esse aqui é um react agents, correto? Beleza?

**4:18** · Correto. Então o que tá acontecendo aqui? Entra a pergunta, o a minha LLM tem ferramentas, só que diferente do padrão que a gente tá acostumado, eu tenho um subagente, correto? Esse subagente é responsável por fazer pesquisas. Por exemplo, ele foi lá, ele poderia ir lá, você ainda não viu isso, eu vou mostrar já já. E ele vai trazer o retorno da pesquisa para LLM, que finalmente vai dar a resposta. É exatamente a técnica que o Cloud Code e o Codex usam. É isso que eu tô te mostrando aqui.

**4:45** · Só que ao invés de você ficar, ó, Codex, ó, Cloud Code, você cria a sua harness, isso aqui se chama harness, OK? Então, a gente tá fazendo uma reg usando o benefício da harness. E aí, no final do dia você tem algo assim, ó. Você pode ter um sistema de pastas, simulando um sistema de pastas, mas na verdade os seus arquivos estarem tanto num bucket quanto num banco de dados.

**5:08** · Legal, né? Isso é muito legal mesmo, tá?

**5:10** · Mas antes de eu voltar para lá, deixa eu só dar um recap aqui. O que que é a reg.

**5:16** · E 2.5.

**5:17** · Basicamente, esse meu vídeo aqui explica tudo da reg 2.5. Se você ainda não viu, tá aí. Provavelmente é um dos melhores vídeos no tema disparado, muito completo. E se você tá na comunidade, tem uma aula mostrando como implementar exatamente isso aqui. Passo a passo, teste, parará, para você fazer uma reg boa hoje com isso aqui, tá? Show de bola. Tá. Ah, Ronas, mas não tem esse esse conteúdo novo lá na comunidade? Tem exatamente o que eu tô mostrando para vocês aqui, tá lá no repositório, tudo bonitinho. Exatamente o que eu tô mostrando aqui nesse vídeo.

**5:48** · Então você baixa lá e roda na tua máquina e eventualmente eu vou gravar aula nisso.

**5:52** · Beleza? Tá progredindo. E o que que essa reg aqui faz? Essa reg ela tem um agente só. Então ela não tem suagente e ela tem ferramentas. E basicamente ela busca também no banco de dados e a gente faz com post greay aqui. Então a gente tem uma coluna eh vetorial e uma coluna de busca esparça. Nós buscamos lá e trazemos os resultados. A gente precisa fazer chunking. Qual é o benefício disso aqui? A busca fica muito precisa quando você combina isso aqui e faz busca híbrida, tá? Só que a criação de chunking é algo que dá trabalho, bastante trabalho, tá?

**6:24** · Então você tem que ser criterioso na criação de chunking. E lá eu mostro como você faz isso passo a passo, devagarzinho, parará, para você tirar o melhor resultado. Não existe bala de prata, você vai ter que testar e as técnicas de chunking e eu mostro tudo. E dessa geração aqui, o que a gente ficou da 2.5, a gente ficou com o reanking, que é uma técnica de depois você pega o resultado, você filtra ele novamente. E a gente ficou com a busca híbrida, que é usar tanto a busca semântica, tanto a busca esparsa. Lá na Rock Pro tem um conteúdo só sobre o que é busca semântica.

**6:55** · Então você vai lá, se você não sabe o que eu tô falando e dá uma olhada, você não tem como aprender se você não se dedicar, tá? Então você tem que ler minimamente, saber o que eu tô falando. Beleza? Você tá no no na comunidade, tem aula lá completa, passo a passo, beleza? Show de bola, tá?

**7:09** · Ronald, qual a diferença dessa 2.5 para um? A um, cara, foi o primeiro modelo que a gente fez pelo seguinte, há dois anos atrás. E se você tá entrando nessa área agora, deixa eu te contar aqui, eh, o veterano que já tá aqui desde que saiu o GPT 3.5, as LLMs não chamavam ferramentas e as que primeiras que surgiram chamavam muito mal. Então, a gente não poderia usar ferramentas para fazer buscas de nada, porque não dava para fazer busca, porque era impossível fazer busca, porque não tinha LLM, não sabia chamar ferramenta. Beleza?

**7:39** · Então, a técnica aqui é você recebe a pergunta, que é a entrada do usuário, que que é o protocolo êxodos. Ele transforma essa pergunta num vetor igual isso aqui. Você faz a busca no banco de dados diretamente e depois dá para LLM já com a busca. Você já pega e já insere aquilo no contexto direto, sem nenhuma sem nenhum filtro. Esse foi o primeiro esforço, tá? Esse esforço aqui e você vê que a tabela dele se parece com isso aqui, tá?

**8:04** · A reg 2.0 que tá aqui é parecida com essa aqui, só que sem ranking, é com técnica de chunking muito pobre. Então se você tá acostumado a fazer eh chunking lá no N8N que ele corta por palavra, aquilo ali é uma péssima forma de fazer chunking, tá?

**8:21** · Então depois surgiram outras formas de chunk. Esses dois aqui são os melhores no geral, pelo menos nos resultados que eu pego. E a gente criou mais uma coluna aqui de busca esparsa. E depois a gente pega a combinação dessas duas buscas, faz uma busca final, né, uma refinamento e entrega o resultado para LLM que dá a resposta. Beleza? Tá, Ron falou para caramba, mas eu precisava, senão você não vai entender o histórico. E tem vantagens de usar isso aqui, tá cara?

**8:44** · Esses dois ainda, mas você vai ver a partir de agora a nossa reg no mundo moderno. Então, vamos lá, vamos pegar a mesma pergunta. O que é o protocolo êxodos? Tá, você vê que eu não tô dando nenhum detalhe para ele, né? nenhuma hint, tá? E aí você vai ver que vai acontecer um pancada de coisa e você deve estar se perguntando: "Caramba, R, isso é muito rápido, né? Eu vou te mostrar porque é rápido assim e tem um motivo para usar LM desse jeito. Aguenta aí, tá? E aí você vai ver o que aconteceu aqui. Vamos voltar para cá atualmente. Parará. Vamos lá. Aqui, tá?

### Explorando busca com subagentes + Virtual file System

**9:17** · Ele criou uma Tesk. O que que é essa tesque? Pesquisar arquivos nos nos diretórios paraará sobre protocolo êxodos. O que que tá acontecendo aqui? A gente vai ver no detalhe. A TESC tem um achado. Aí você vai ver, ó, achados principais. O protocolo êxodos é isso, segundo programa da comunidade. Parará, parará, parará. Show de bola. E aí a Iá nos dá a resposta. Olha que legal, né? E a resposta foi perfeita. E não só isso, ele trouxe para mim aqui a fonte. Legal, né? Tá bom. Vamos olhar aqui o tracing, que ele é a fonte da verdade.

**9:48** · O tracing nada mais é do que de fato acontece por debaixo dos panos. Se você é sério em criar soluções, você tem que saber o que acontece debaixo dos panos para você não virar eh passageiro da LLM. Você tem que ser dono da sua solução, correto? Então, beleza. Tá? O que que eu quero mostrar aqui para vocês?

**10:07** · Vocês vão ver aqui que na chamada, no geral, eles vão vão ter esse essa lista aqui de ferramentas, tá vendo aqui, ó?

**10:14** · Tools, tá? E a nossa LLM vai ficar chamando essas tools. Você tá vendo aqui, ó, task, que eu mostrei ali ainda agora. E aí você vai ver que tem outras tools, como LS, como Glob, como Grap. Se você não conhece, não tá acostumado com isso aqui, se você usa Linux, Mac e coisas do tipo, você tem esse tipo aqui de comando para ver arquivos. E é exatamente assim que o Cloud Code faz, que o Codex faz. E agora a gente tá fazendo na nossa solução. Vou voltar para lá e aí eu vou explicar para você o código. Esse aqui é o código do agente, tá? O que que eu tô fazendo aqui antes de progredir?

**10:45** · Eu tô usando um modelo open source, não é bem pequenininho, tá?

**10:53** · E aí você vai ver que ele tem aqui é um GPT 120, tá? E ele se chama Exacto no final. O que que é isso, Ron? O que que é Exacto? Vem cá comigo, tá? O que que é esse cara aqui? Esse cara é um modelo retreinado. Então ele pegou o modelo original para chamada de ferramentas. E esse é o detalhe crucial nisso que eu tô falando aqui. Essa arquitetura aqui é feito para chamada de ferramentas. Ele precisa muito que sua LLM seja boa em chamada de ferramentas.

**11:21** · Se você usar uma LLM que não é tão boa em chamada de ferramentas, provavelmente você vai ter resultados ruins, porque ele não vai saber quando entrar no arquivo virtual, dar um LS. Ele não vai saber muito bem também como delegar pro subagente, porque ele não é bom nessa técnica, OK?

**11:36** · E esse é o primeiro downside. Pelo seguinte, se você vê aqui, ó, qual é o preço desse cara aqui, eu tô usando o Grock e eu vou te mostrar ali já. 15 para 60 é um preço razoável, mas obviamente esse modelo aqui não é tão bom quanto o Opus, quanto o GPT 5.4 na chamada de ferramenta, OK? Então você tem que tomar muito cuidado quando você usar isso aqui para você não ir à falência.

**12:01** · Pelo seguinte, esse tipo de solução aqui, vamos voltar lá pro pro nosso pro nosso tracing, ele vai gastar sempre muito token, cara. Muito token. Ó, você vê aqui, ó, que eu gastei 22.000 tokens só para fazer essas chamadinhas aqui, tá?

**12:18** · Então, obviamente, esse é um exemplo mínimo aqui que eu tô demonstrando para vocês, mas no dia a dia o o teu custo de token vai explodir. Se você não desenvolver técnica para trabalhar com LLMs pequenas, LLMs baratas e que te entreguem o mesmo resultado, um resultado muito próximo das LLMs mais caras, você não consegue jogar esse jogo, tá? Então esse jogo mais do que nunca é um jogo de técnica.

**12:38** · E a gente tá nesse momento com tokens sendo barateados pela pela pelo cloud Parará, que se você tentar usar a IPI do cloud, por exemplo, direto, essa chamada aqui já daria uns sei lá. Não, não nesse aqui, mas você vai perceber rapidamente que é inviável criar qualquer solução usando essas LLMs de ponta e você vê que o jogo jogado lá não é o mesmo que você tá jogando, sacou?

**13:05** · Beleza, tá bom? Vamos voltar para cá.

**13:08** · Então, qual é o malefício? é que ele gasta muito token, mas ele funciona muito bem, tá? O que que eu tô fazendo aqui? Eu tô usando o provider Grock, tá?

**13:16** · Grock com Q pelo seguinte, deixa eu voltar para cá. Isso é muito interessante. Você tá vendo aqui, ó, true Tá vendo aqui? Isso aqui, ó, requestes por segundo, desculpa. Tkens por segundo, tá? TPS. O que que é isso aqui? A cada segundo ele faz 477 tokens.

**13:36** · Então, olha a diferença pros outros provedores, olha aqui, tá? Então, se você, se eu usasse um desses outros provedores aqui, o meu tempo de resposta seria muito baixo. Então, se você tá usando esses tipos de solução aqui, você tem que fazer com que a sua saída, a sua geração de token seja rápida, pro teu cliente não ficar entediado lá, tá?

**13:54** · Então, esse é um detalhe importante. E você vê que o preço dele é um pouquinho mais caro do que o outro, ó. Tá vendo?

**13:59** · Mas é o preço que vale a pena, correto?

**14:01** · Então, se você cria solução, não é engenharia sabor, engenharia de ar, sabor, tá? Se você cria solução de verdade, bota no ar, não é demo, tá? Ah, criei meu agente pessoal, tá? Cara, se você criação para as pessoas usarem, você tem que prestar atenção nesse tipo de coisa também. Beleza? Beleza. Então, é por isso que eu tô usando o Grock Exacto, para chamar de ferramenta, eh, e fazer tudo muito rápido. Show de bola.

**14:25** · Show de bola. Tá bom, a gente já viu isso aqui, já viular lá. Agora a gente vai voltar e eu quero mostrar para vocês não só isso aqui, eu quero mostrar para vocês o prompt, tá? Então eu tenho aqui meu gráfo, tá? Eh, com um agente e um suagente, tá? Beleza? Show de bola.

**14:40** · Então, como que esse prompt é configurado? Tá? Eu tenho dois prompt.

**14:43** · Eu tenho um promptente.

**14:47** · Esse aqui é o subagente. E eu tenho um promptente.

**14:51** · Vamos voltar aqui na na aqui no tracing.

**14:55** · E aí você vai ver exatamente o momento em que meu agente principal, né, o doc agents, chama o meu subagente research.

**15:02** · Então ele cria uma tarefa. Então você lembra lá que apareceu a tarefa. Ele criou a tarefa, ele chama o research e ele faz o trabalho dele, que é exatamente listar todos os arquivos, né?

**15:14** · e depois fazer a pesquisa que ele queria fazer, né? Então você vê aqui, ó, chamada de LLM, tá? 6000 tokens. Vai vir para cá, ó, 9.000 tokens, 2000 tokens, 3.000 tokens. E isso ele sequer carregou o documento total, né?

**15:34** · Ele ainda tá pesquisando. Então isso você sempre vai gastar muito token, muito, muito token.

**15:39** · Qual o detalhe que eu quero mostrar aqui para vocês, tá? Esses documentos aqui que eu tô usando, eles são bem pequenos.

**15:45** · Você tá vendo aqui, né? Tá vendo aqui? O protocolo êxodos é isso e aquilo, outro.

**15:49** · Se você tá se perguntando o que é o protocolo êxodos, a gente tá criando um exatamente o êxodos, né? A gente tem o Gênesis, que é para você começar a ser engenheiro de a, a criar sua solução de verdade, sem tudo, front end, back end, botar no ar, parará, parará. E ous é a galera que tá presa em agente do WhatsApp usando N8N. não dá futuro, não tem como. Então, a gente tá fazendo um programa aqui para tirar tudo. E aí eu aproveitei para mostrar mensageria, eh, e todo o tipo de coisa que uma solução de A real tem.

**16:19** · Então, não é sabor engenharia de a, engenheir a de verdade, tá? Então, o documento não é tão grande.

**16:26** · Você vê que o documento é pequenininho.

**16:27** · E aqui que tá o pulo do gato, se você tá criando essa solução aqui. Então, vamos voltar lá pro nosso comparativo porque é importante, tá? O que que você vai fazer? Você vai lá no seu sistema, vai jogar isso aqui para tua LLM. Se o teu documento for grande demais e no mundo corporativo a gente tem aqueles PDFs de 500 páginas, né? Você tá encrencado.

### Quando usar cada geração de RAG

**16:48** · Então o que você vai ter que fazer? Você vai ter que quebrar esse documento em pequenos pedacinhos. Beleza? Você vai ter que quebrar esse documento pedacinhos. Por quê? Você não quer que tudo seja inserido na tua janela de contexto ou que seu LM tem acesso a todo documento, senão você vai gastar mais token, vai ser mais lento e a qualidade da resposta tende a ser menor, tá? Então você vai ter que fazer um trabalho aqui de processamento, um ETL, antes de você pegar o documento cru do jeito que tá e jogar aqui. Isso dá trabalho, tá? Ah, Ronald, vou usar Docklin, cara, não funciona bem assim, no geral, não existe uma bala de prata.

**17:18** · Você vai ter que achar a solução pro seu tipo de documento. Por exemplo, PDF tem um monte de restrição, muita das vezes você vai ter que criar um processamento. Não acredite nas fantasias da internet que você vê o mundo real, ele tem mais detalhes, mais nuances. E é exatamente por isso que as pessoas pagam, porque elas não conseguem fazer. Por que isso não é um problema aqui? Porque aqui a gente já faz chunking naturalmente, tá?

**17:41** · Então a gente já quebra o documento em pequenos pedaços, tá? Então esse aqui performa muito bem nesses tipos de caso, por exemplo, porque você vai ter documentos enormes, você naturalmente já quebra esses documentos enormes em pequenos pedacinhos e isso já tá naturalmente coberto. Aqui você vai economizar muito token, tá, no longo prazo em relação a isso aqui. Só que só que isso dá trabalho para caramba de fazer, tá? Então você vai ter que eh botar aí na balança o que você quer fazer. Isso aqui também dá trabalho, tá, cara? Isso aqui não é tão simples de botar em produção, não, tá?

**18:11** · Isso aqui você vai ter que ter conhecimento de back end, você vai ter que ter conhecimento de um monte de coisa que a Globo não mostra. Aqui na internet vão falar que vai máscara, você clica ali, não é? Você vai ter que ter vários conhecimentinhos, beleza? Obviamente se você quiser ter esse conhecimento, comunidade, beleza? Eh, quando que eu uso isso aqui, Ronald? Se você tiver num projeto que você tem uma restrição de LLM, você precisa usar LLM pequena, esse aqui é um bom candidato, tá? Obviamente você não vai ter tão bons resultados quanto esse aqui, mas você vai conseguir bons resultados. E o que que você pode fazer?

**18:42** · Você pode fazer uma regra aqui, 1.5, tá? Você pode fazer 1.5, nada vai te impedir, tá? Você vai adicionar essa técnica aqui de busca híbrida aqui, tá?

**18:53** · Então você vai entrar ali, você faz uma busca híbrida aqui logo de cara e integra para LLM já o resultado pronto.

**18:58** · Usando essas técnicas aqui, o teu resultado vai disparar de qualidade.

**19:02** · Você vai ver que é absurdamente melhor fazer busca híbrida do que fazer busca semântica apenas. Beleza? Espero que você tenha curtido. Espero que agora você saiba a diferença entre essas três gerações. Beleza? Só recapitulando, reg, tá? Se você tá perdido nesse termo, é retrieval e geração aumentada. O que que é retrieval? É busca. Então, exatamente isso aqui, tá? Então, reg não tá preso a um banco de dados vetorial, não tá preso a alguma coisa do tipo. É só um método de você pegar o dado, dar para LLM e gerar resposta.

**19:32** · No final do dia você quer gerar a resposta correta. Todas essas técnicas têm custo e cabe a você que cria a solução ou que quer criar um negócio ao redor disso, descobrir aonde tá a melhor oportunidade, aonde tá a melhor qualidade e tirar proveito do teu conhecimento. No fim do dia, conhecimento é poder. Valeu, abraço.