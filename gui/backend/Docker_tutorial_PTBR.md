## Docker
> [!IMPORTANT] 
>** Pré-requisitos** <br>
> - 🐳 [Docker](https://docs.docker.com/engine/install/)
> - 🐳 [Docker Compose](https://docs.docker.com/compose/install/linux/#install-using-the-repository)

---

### Passo 1. Baixar a imagem do LETSpred
Abra o terminal e execute o comando abaixo para baixar a imagem Docker do LETSPred

```bash
docker pull annotep/letspredcli:v1
```

> Você só precisa fazer isso **uma vez**. A imagem fica salva localmente.
---

### Passo 2. Estrutura do comando
O comando base para usar o LETSpred tem a seguinte estrutura:
 
```bash
docker run --rm \
  --user $(id -u):$(id -g) \
  -v /caminho/para/seus/arquivos:/data \
  annotep/letspredcli:v1 COMANDO [OPÇÕES]
```
 
| Parte | O que faz | Por que está aqui |
|---|---|---|
| `docker run` | Executa um container | Comando principal do Docker |
| `--rm` | Remove o container após terminar | Evita acúmulo de containers parados |
| `--user $(id -u):$(id -g)` | Usa seu usuário dentro do container | Arquivos gerados ficam com suas permissões, sem cadeado |
| `-v /caminho/para/seus/arquivos:/data` | Monta sua pasta local dentro da pasta `/data` no container | Permite que o container acesse seus arquivos |
| `annotep/letspredcli:v1` | Nome da imagem a ser usada | Identifica qual programa rodar |
| `COMANDO [OPÇÕES]` | Comando e argumentos do LETSpred | O que você quer que a ferramenta faça |

> [!WARNING] 
> /caminho/para/seus/arquivos é um placeholder — você deve substituí-lo pelo caminho real da pasta onde seus arquivos estão no seu computador.
> Exemplos reais:
> * Linux/macOS: -v /home/joao/projeto_lets:/data
> * macOS (pasta Downloads): -v /Users/maria/Downloads/meus_dados:/data
> * Windows (WSL): -v /mnt/c/Users/pedro/Documents/lets_data:/data
>
> Os arquivos que você quer processar precisam estar dentro dessa pasta antes de rodar o comando.

---
 
### Passo 3. Criar um modelo preditivo
Antes de rodar o LETSpred, certifique-se de que você tem os seguintes arquivos em uma pasta no seu computador:
| Arquivos | Descrição |
|---|---|
| `actives_datawarrior.txt` | Exportado do DataWarrior com compostos ativos |
| `decoys_datawarrior.txt` | Exportado do DataWarrior com decoys |
| `active_consolidated.csv` | Arquivo CSV consolidado de ativos |
| `decoys_consolidated.csv` | Arquivo CSV consolidado de decoys |

> [!NOTE]
> O progama aceita qualquer nome nos arquivos

> [!IMPORTANT]
> Esses arquivos não vêm com o Docker e precisam ser gerados ou obtidos por você antes de continuar.

### Passo 4. Criar um modelo preditivo
O comando `create-model` treina um modelo de machine learning com seus dados de ativos e decoys.
Substitua `/caminho/para/seus/arquivos` pelo caminho real da sua pasta, e `nome_do_projeto` pelo prefixo desejado:
 
```bash
docker run --rm \
  --user $(id -u):$(id -g) \
  -v /caminho/para/seus/arquivos:/data \
  annotep/letspredcli:v1 create-model \
  --actives-datawarrior /data/actives_datawarrior.txt \
  --decoys-datawarrior /data/decoys_datawarrior.txt \
  --actives-consolidated /data/active_consolidated.csv \
  --decoys-consolidated /data/decoys_consolidated.csv \
  --output /data/nome_do_projeto
```

> [!NOTE]
> Perceba que os caminhos dos arquivos **dentro do comando** (`/data/actives_datawarrior.txt`, etc.) sempre começam com `/data/` — isso é fixo e não deve ser alterado. O `/data` é o nome da pasta **dentro do container**, que corresponde à sua pasta local definida no `-v`.
> Os resultados são salvos na mesma pasta dos seus arquivos de entrada.
> Cada execução gera uma pasta nova com data e hora no nome (ex: `nome_do_projeto-20260319_1430`), então você pode rodar o comando várias vezes sem sobrescrever resultados anteriores.

> [!TIP]
> O horário no nome da pasta usa **UTC** por padrão — 3 horas à frente do horário de Brasília.
> Para usar o horário local, adicione `-e TZ=America/Sao_Paulo` ao comando:
> ```bash
> docker run --rm \
>   --user $(id -u):$(id -g) \
>   -e TZ=America/Sao_Paulo \
>   -v /caminho/para/seus/arquivos:/data \
>   annotep/letspredcli:v1 create-model ...
> ```
> Você pode encontrar o identificador do seu fuso horário na [base de dados tz](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).
 
**Parâmetros:**
 
| Parâmetro | Descrição |
|---|---|
| `--actives-datawarrior` | Arquivo `.txt` exportado do DataWarrior com compostos ativos |
| `--decoys-datawarrior` | Arquivo `.txt` exportado do DataWarrior com decoys |
| `--actives-consolidated` | Arquivo `.csv` consolidado de ativos |
| `--decoys-consolidated` | Arquivo `.csv` consolidado de decoys |
| `--output` | Prefixo da pasta de saída (criada automaticamente com data e hora) |
 
**Saída esperada:**
 
```
Starting pipeline | prefix: /data/nome_do_projeto
[1/6] Preparing files...
[2/6] Pre-treating data...
[3/6] Normalizing data...
[4/6] Training models...
[5/6] Computing applicability domain...
[6/6] Predicting compounds...
Pipeline complete! Results saved to: /data/nome_do_projeto-20260314_1450
```
 
Os resultados ficam dentro de `/caminho/para/seus/arquivos/nome_do_projeto-YYYYMMDD_HHMM/`.
 
---
 
### Passo 5. Dica: usando a pasta atual
Se seus arquivos estão na pasta onde você está no terminal, use `$(pwd)` para não precisar digitar o caminho completo:
 
```bash
cd /caminho/para/seus/arquivos
 
docker run --rm \
  --user $(id -u):$(id -g) \
  -v $(pwd):/data \
  annotep/letspredcli:v1 create-model \
  --actives-datawarrior /data/actives_datawarrior.txt \
  --decoys-datawarrior /data/decoys_datawarrior.txt \
  --actives-consolidated /data/active_consolidated.csv \
  --decoys-consolidated /data/decoys_consolidated.csv \
  --output /data/resultado
```
 
> `$(pwd)` é substituído automaticamente pelo caminho da pasta atual.
 
---
 
### Passo 6. Solução de problemas
| Erro | Causa | Solução |
|---|---|---|
| `Permission denied` na pasta de saída | Pasta sem permissão de escrita | Execute `chmod 777 /sua/pasta` |
| `FileNotFoundError: /data/arquivo.txt` | Arquivo não encontrado no volume | Verifique se o `-v` aponta para a pasta correta e confira o nome do arquivo com `ls` |
| `no configuration file provided` | Rodando `docker compose` fora da pasta do projeto | Use `docker run` (sem compose) de qualquer pasta |
| Arquivos gerados com cadeado | Container rodando sem `--user` | Adicione `--user $(id -u):$(id -g)` ao comando |
 
---
 
### Passo 7. Ajuda do CLI
Para ver todos os comandos disponíveis:
 
```bash
docker run --rm annotep/letspredcli:v1 --help
```
 
Para ver as opções de um comando específico:
 
```bash
docker run --rm annotep/letspredcli:v1 create-model --help
```

### Explicações
Entendendo o `--user $(id -u):$(id -g)`

Por padrão, processos dentro de containers Docker rodam como `root` (superusuário). Isso causa um problema prático: os arquivos gerados pelo LETSpred ficam com dono root, e você não consegue abrir, mover ou apagar esses arquivos sem usar `sudo`.
O `--user $(id -u):$(id -g)` resolve isso informando ao container para rodar com a identidade do seu próprio usuário:

| Parte | O que representa | Exemplo |
|---|---|---|
| `$(id -u)` | Seu UID — número de identificação do seu usuário no sistema | `1000` |
| `$(id -g)` | Seu GID — número do grupo principal do seu usuário | `1000` |

O Docker repassa esses números para o container, que então cria os arquivos como se fossem seus — sem precisar de permissão de root.

