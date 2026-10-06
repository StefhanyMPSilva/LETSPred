# LETSpred

LETSpred é uma ferramenta de pipeline de aprendizado de máquina para prever a atividade de compostos químicos contra alvos biológicos. Ela utiliza descritores moleculares (DataWarrior) e pontuações de docking (GOLD) para classificar compostos como ativos ou inativos.

A ferramenta está disponível em dois modos:
- **CLI (Interface de Linha de Comando)** — executa via Docker (sem instalar Python) ou diretamente no Python local
- **GUI (Interface Gráfica)** — executa uma aplicação web local com backend em FastAPI e frontend em React

> A versão em inglês deste guia está disponível em [README.md](README.md).

---

## Requisitos do Sistema

| Componente | Mínimo | Recomendado |
|---|---|---|
| Sistema Operacional | Windows 10, macOS 11, Ubuntu 20.04 | Windows 11, macOS 13+, Ubuntu 22.04 |
| RAM | 4 GB | 8 GB ou mais |
| Espaço em disco | 5 GB livres | 10 GB livres |
| CPU | 4 threads | 16+ threads |

> A etapa de treinamento de modelos é intensiva em CPU. Mais núcleos e RAM aceleram o processo.

---

## Modo 1 — CLI (via Docker)

Este modo requer apenas o Docker. Não é necessário instalar Python, Node.js ou qualquer outro runtime manualmente.

### Ferramentas necessárias

| Ferramenta | Finalidade | Download |
|---|---|---|
| Docker | Executa o pipeline em container | [docs.docker.com/engine/install](https://docs.docker.com/engine/install/) |
| Docker Compose | Gerencia configuração de múltiplos containers | [docs.docker.com/compose/install](https://docs.docker.com/compose/install/linux/#install-using-the-repository) |

> **Usuários Windows:** Instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/), que já inclui o Docker e o Docker Compose.
>
> **Usuários Linux:** Após instalar o Docker, siga as [etapas de pós-instalação](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user) para executar o Docker sem `sudo`.

### Passo 1 — Baixar a imagem do LETSpred

Abra o terminal e execute:

```bash
docker pull annotep/letspredcli:v1
```

> Você só precisa fazer isso uma vez. A imagem fica salva localmente.

### Passo 2 — Preparar os arquivos de entrada

Antes de rodar o LETSpred, coloque os seguintes arquivos em uma pasta no seu computador:

| Arquivo | Descrição |
|---|---|
| `actives_datawarrior.txt` | Exportado do DataWarrior com compostos ativos |
| `decoys_datawarrior.txt` | Exportado do DataWarrior com decoys |
| `active_consolidated.csv` | Arquivo CSV consolidado de ativos (do GOLD) |
| `decoys_consolidated.csv` | Arquivo CSV consolidado de decoys (do GOLD) |

> Esses arquivos não estão incluídos na imagem e precisam ser gerados ou obtidos por você antes de continuar.

### Passo 3 — Criar um modelo preditivo

O comando `create-model` treina modelos de machine learning com seus dados de ativos e decoys. Substitua `/caminho/para/seus/arquivos` pelo caminho real da pasta com seus arquivos e `nome_do_projeto` pelo nome que desejar:

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

**Exemplos de caminho por sistema operacional:**

| SO | Exemplo da flag `-v` |
|---|---|
| Linux | `-v /home/joao/meu_projeto:/data` |
| macOS | `-v /Users/maria/Downloads/meus_dados:/data` |
| Windows (WSL) | `-v /mnt/c/Users/pedro/Documents/meus_dados:/data` |

> Os caminhos **dentro do comando** (começando com `/data/`) são fixos — eles se referem à pasta dentro do container, não ao seu computador. Apenas a parte antes dos dois-pontos no `-v` deve ser alterada.

**Saída esperada:**

```
[1/6] Preparing files...
[2/6] Pre-treating data...
[3/6] Normalising data...
[4/6] Training models...
[5/6] Computing applicability domain...
[6/6] Predicting compounds...
Pipeline complete! Results saved to: /data/nome_do_projeto-20260319_1430
```

Os resultados são salvos em uma nova pasta dentro de `/caminho/para/seus/arquivos/`, com o prefixo e um timestamp no nome (ex: `nome_do_projeto-20260319_1430`).

### Passo 4 — Prever com um modelo pré-construído

Se quiser usar um modelo já treinado e incluído na ferramenta:

```bash
docker run --rm \
  --user $(id -u):$(id -g) \
  -v /caminho/para/seus/arquivos:/data \
  annotep/letspredcli:v1 prebuildmodel \
  --build-name NOME_DO_MODELO \
  --actives-datawarrior /data/actives_datawarrior.txt \
  --actives-consolidated /data/active_consolidated.csv \
  --output /data/nome_dos_resultados
```

### Passo 5 — Prever com seu próprio modelo treinado

Se você já executou o `create-model` anteriormente e quer usar aquele modelo para novas predições:

```bash
docker run --rm \
  --user $(id -u):$(id -g) \
  -v /caminho/para/seus/arquivos:/data \
  annotep/letspredcli:v1 usermodel \
  --run-name nome_do_projeto-20260319_1430 \
  --actives-datawarrior /data/actives_datawarrior.txt \
  --actives-consolidated /data/active_consolidated.csv \
  --output /data/nome_dos_resultados
```

### Dica — usando a pasta atual

Se seus arquivos estão na pasta onde o terminal está aberto, use `$(pwd)` para não precisar digitar o caminho completo:

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

> `$(pwd)` funciona no Linux e macOS. No Windows (PowerShell) use `${PWD}`.

### Ajuda do CLI

```bash
# Listar todos os comandos disponíveis
docker run --rm annotep/letspredcli:v1 --help

# Ver as opções de um comando específico
docker run --rm annotep/letspredcli:v1 create-model --help
```

### Solução de problemas

| Erro | Causa | Solução |
|---|---|---|
| `Permission denied` na pasta de saída | Pasta sem permissão de escrita | Execute `chmod 777 /sua/pasta` |
| `FileNotFoundError: /data/arquivo.txt` | Arquivo não encontrado dentro do container | Verifique se o `-v` aponta para a pasta correta e confira o nome do arquivo com `ls` |
| Arquivos gerados com permissão bloqueada | Container rodando sem `--user` | Adicione `--user $(id -u):$(id -g)` ao comando |

---

## Modo 1b — CLI (instalação local, sem Docker)

Use esta opção se preferir rodar o CLI diretamente no Python, sem Docker.

### Ferramentas necessárias

| Ferramenta | Versão mínima | Finalidade | Download |
|---|---|---|---|
| Python | 3.9 | Executar o pipeline | [python.org/downloads](https://www.python.org/downloads/) |
| pip | incluído com o Python | Instalar dependências | — |
| Git | qualquer | Clonar o repositório | [git-scm.com](https://git-scm.com/) |

### Passo 1 — Clonar o repositório

```bash
git clone https://github.com/...
cd LETSpred-GUI
```

### Passo 2 — Criar e ativar o ambiente virtual

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Passo 3 — Instalar as dependências

```bash
cd cli
pip install -r requirements.txt
```

> Esta etapa pode levar alguns minutos na primeira execução.

### Passo 4 — Executar o CLI

Com o ambiente virtual ativo, os comandos são os mesmos do Docker, mas sem o prefixo `docker run`:

**Criar um modelo:**
```bash
python cli.py create-model \
  --actives-datawarrior /caminho/actives_datawarrior.txt \
  --decoys-datawarrior /caminho/decoys_datawarrior.txt \
  --actives-consolidated /caminho/active_consolidated.csv \
  --decoys-consolidated /caminho/decoys_consolidated.csv \
  --output nome_do_projeto
```

**Usar um modelo pré-construído:**
```bash
python cli.py prebuildmodel \
  --build NOME_DO_MODELO \
  --actives-datawarrior /caminho/actives_datawarrior.txt \
  --actives-consolidated /caminho/active_consolidated.csv \
  --output nome_dos_resultados
```

**Usar seu próprio modelo treinado:**
```bash
python cli.py usermodel \
  --run nome_do_projeto-20260319_1430 \
  --actives-datawarrior /caminho/actives_datawarrior.txt \
  --actives-consolidated /caminho/active_consolidated.csv \
  --output nome_dos_resultados
```

### Ajuda do CLI

```bash
# Listar todos os comandos disponíveis
python cli.py --help

# Ver as opções de um comando específico
python cli.py create-model --help
```

### Comparação — Docker vs instalação local

| | Docker | Instalação local |
|---|---|---|
| Instalar Python | ❌ Não necessário | ✅ Necessário |
| Instalar dependências | ❌ Não necessário | ✅ Necessário |
| Compatibilidade garantida | ✅ Sempre | ⚠️ Depende do ambiente |
| Acesso aos arquivos | Via `-v` (volume) | Caminhos diretos |
| Ideal para | Uso pontual, qualquer SO | Desenvolvimento e testes |

### Solução de problemas

| Erro | Causa | Solução |
|---|---|---|
| `ModuleNotFoundError` | Dependências não instaladas ou venv inativo | Ative o venv e execute `pip install -r requirements.txt` |
| `python` não encontrado no Linux/macOS | `python3` é o padrão | Use `python3 cli.py` no lugar de `python cli.py` |
| `Permission denied` na pasta de saída | Pasta sem permissão de escrita | Execute `chmod 777 /sua/pasta` |

---

## Modo 2 — GUI (FastAPI + React)

Este modo executa uma aplicação web local. O backend é um servidor FastAPI e o frontend é uma aplicação React construída com Vite.

### Ferramentas necessárias

| Ferramenta | Versão mínima | Finalidade | Download |
|---|---|---|---|
| Python | 3.9 | Backend (FastAPI) | [python.org/downloads](https://www.python.org/downloads/) |
| pip | incluído com o Python | Gerenciador de pacotes Python | — |
| Node.js | 18 | Ferramenta de build do frontend | [nodejs.org](https://nodejs.org/) |
| npm | incluído com o Node.js | Gerenciador de pacotes JavaScript | — |
| Git | qualquer | Clonar o repositório | [git-scm.com](https://git-scm.com/) |

### Passo 1 — Clonar o repositório

```bash
git clone https://github.com/your-org/LETSpred-GUI.git
cd LETSpred-GUI
```

> Substitua a URL pelo endereço real do repositório, se diferente.

### Passo 2 — Configurar o backend Python

Navegue até a pasta do backend e crie um ambiente Python isolado:

```bash
cd gui/backend
```

#### Criar o ambiente virtual

**Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows (Prompt de Comando):**
```cmd
python -m venv venv
venv\Scripts\activate
```

**Windows (PowerShell):**
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

> O ambiente virtual isola os pacotes Python do projeto do resto do seu sistema. O prompt do terminal mudará para mostrar `(venv)` quando estiver ativo.

#### Instalar as dependências Python

```bash
pip install -r requirements.txt
```

> Esta etapa pode levar alguns minutos na primeira execução, pois baixa bibliotecas como scikit-learn, XGBoost e FastAPI.

#### Iniciar o servidor FastAPI

```bash
uvicorn app.api:app --reload --host 0.0.0.0 --port 8000
```

Você deverá ver uma saída semelhante a:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

> Deixe este terminal aberto enquanto usa a aplicação. A flag `--reload` reinicia o servidor automaticamente ao alterar código do backend. Remova-a em produção.

### Passo 3 — Configurar o frontend React

Abra um **novo terminal** (mantenha o terminal do backend aberto) e navegue até a pasta do frontend:

```bash
cd gui/frontend
```

#### Instalar as dependências JavaScript

```bash
npm install
```

> Isso baixa todos os pacotes do frontend para a pasta `node_modules`. Pode demorar um pouco na primeira execução.

#### Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Você deverá ver:

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### Passo 4 — Abrir a aplicação

Abra o navegador e acesse:

```
http://localhost:5173
```

A GUI estará disponível e se comunicará com o backend FastAPI em execução em `http://localhost:8000`.

### Estrutura de diretórios

```
LETSpred-GUI/
├── cli/                        # Código-fonte do CLI
│   ├── cli.py                  # Ponto de entrada principal do CLI
│   ├── core/                   # Módulos de processamento do pipeline
│   └── example_files/          # Arquivos de entrada de exemplo
└── gui/
    ├── backend/                # Servidor FastAPI
    │   ├── app/
    │   │   ├── api.py          # Definição da aplicação FastAPI
    │   │   ├── routes.py       # Handlers das rotas da API
    │   │   └── schemas.py      # Schemas de requisição/resposta
    │   ├── core/               # Módulos de processamento do pipeline
    │   ├── prebuildmodel/      # Arquivos de modelos pré-construídos
    │   ├── usermodel/          # Modelos treinados pelo usuário (gerado)
    │   ├── output_predictions/ # Resultados das predições (gerado)
    │   ├── main.py             # Orquestração do pipeline
    │   └── requirements.txt    # Dependências Python
    └── frontend/               # Aplicação React
        ├── src/                # Código-fonte da aplicação
        ├── public/             # Arquivos estáticos
        └── package.json        # Dependências JavaScript
```

### Parar a aplicação

- **Frontend:** Pressione `Ctrl+C` no terminal do frontend.
- **Backend:** Pressione `Ctrl+C` no terminal do backend.
- **Desativar o ambiente Python:** Execute `deactivate` no terminal do backend após parar o servidor.

### Solução de problemas

| Erro | Causa | Solução |
|---|---|---|
| `ModuleNotFoundError` ao iniciar o uvicorn | Dependências não instaladas ou venv não ativo | Ative o venv e execute `pip install -r requirements.txt` novamente |
| Porta 8000 já em uso | Outro processo está usando a porta 8000 | Altere a porta: `uvicorn app.api:app --port 8001` e atualize a configuração do frontend |
| Porta 5173 já em uso | Outro servidor Vite está em execução | Pare o outro processo ou execute `npm run dev -- --port 5174` |
| Erro de CORS no console do navegador | Backend não está rodando ou URL incorreta | Certifique-se de que o servidor FastAPI está rodando na porta 8000 |
| `npm install` falha com erro de permissão | Problema de configuração do npm | Tente `npm install --legacy-peer-deps` ou verifique a versão do Node.js com `node --version` |
| Comando `python` não encontrado no Linux/macOS | `python3` é o padrão do sistema | Use `python3` e `pip3` no lugar de `python` e `pip` |
