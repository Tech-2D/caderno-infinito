# Caderno Infinito

Protótipo inicial de um caderno coletivo da Tech-2D. Cada pessoa autenticada pode ler as anotações, buscar por assunto, filtrar por matéria e publicar páginas. O autor pode editar ou apagar as próprias páginas. As atualizações aparecem em tempo real para quem estiver com o site aberto.

## Rodar localmente

```sh
npm ci
npm run dev
```

O app usa o projeto Firebase `d-tech-56a76`, compartilhado com Agenda e Cadê o professor?. A configuração web no código é pública; **não coloque chaves de conta de serviço neste repositório**. O provedor **E-mail/senha** precisa estar habilitado no Firebase Authentication.

## Dados e permissão

Coleção Firestore: `notebookNotes`. Cada documento contém `title`, `content`, `subject`, `className` (turma opcional), `authorUid`, `authorEmail`, `createdAt` e `updatedAt`.

O campo `content` guarda Markdown. O editor oferece prévia, e a leitura aplica o visual do Caderno a títulos, ênfase, listas, links, imagens, citações, código e tabelas. HTML escrito na nota não é interpretado.

As regras ativas do Firebase permitem listar e ler anotações apenas a contas autenticadas. Qualquer conta autenticada pode publicar; somente o UID autor pode alterar ou apagar sua nota. As regras completas são compartilhadas com os repositórios [`professores`](https://github.com/Tech-2D/professores/blob/main/firestore.rules) e [`Agenda`](https://github.com/Tech-2D/Agenda/blob/main/firestore.rules); mantenha as cópias sincronizadas antes de publicar novas regras.

**Limites deste protótipo:** qualquer pessoa pode criar uma conta com e-mail/senha, inclusive fora da escola. Sem confirmação por e-mail, `authorEmail` identifica a conta usada, mas não comprova a posse do endereço. Ainda não há colaboração simultânea na mesma página, comentários ou moderação. Essas decisões podem ser ajustadas nas próximas versões.

## Verificações

```sh
npm run build
npm run lint
npm test
```

O workflow `deploy.yml` publica o site via GitHub Pages a cada push na `main`.
