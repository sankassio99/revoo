# CRM MVP — Requisitos funcionais e não funcionais (Firebase)

Produto: CRM SaaS para barbearias e clínicas de estética Stack: Next.js + TypeScript + Tailwind CSS + Firebase + Docker + Docker Compose.

O Next.js será responsável pela interface e pela lógica de aplicação executada no servidor quando necessário, enquanto o Firebase fornecerá autenticação, banco de dados e infraestrutura de apoio.

## 1. Arquitetura proposta

Next.js + TypeScript

App Router · Tailwind CSS · Server Components · Client Components

Firebase Authentication

Login · Identidade · Sessão · Gestão de utilizadores

### Firebase services

Cloud Firestore

Dados e consultas

Security Rules

Isolamento por tenant

Cloud Functions

Tarefas automáticas

Firebase Cloud Messaging

Notificações push, se necessário

Decisão arquitetural: utilizar o Cloud Firestore como banco de dados principal, Firebase Authentication para identidade e Security Rules para controlar o acesso aos dados.

As Cloud Functions podem ser adicionadas quando forem necessárias operações privilegiadas ou tarefas agendadas. O Firebase Cloud Messaging é opcional e não substitui a integração com a WhatsApp Business Platform.

## 2. Requisitos funcionais

### FR-01 — Multi-tenancy

- FR-01.1: O sistema deve permitir criar uma conta de negócio e um workspace.
- FR-01.2: Cada workspace deve possuir um identificador único (`tenantId`).
- FR-01.3: Um utilizador deve poder pertencer a um ou mais tenants.
- FR-01.4: Cada tenant deve ter as suas próprias configurações, clientes, serviços, profissionais e marcações.
- FR-01.5: O sistema deve impedir o acesso aos dados de outros tenants através de alterações de IDs, URLs ou pedidos diretos ao Firestore.
- FR-01.6: O sistema deve permitir que o proprietário convide colaboradores para o workspace.
- FR-01.7: Cada utilizador deve ter um papel, como `Owner` ou `Staff`.

Critérios de aceitação

- Um utilizador do Tenant A não consegue consultar nem alterar dados do Tenant B.
- As permissões são verificadas pelas Firebase Security Rules, e não apenas pelo frontend.
- A criação de um tenant e do respetivo proprietário não deixa o sistema num estado parcialmente configurado.

### FR-02 — Autenticação

- FR-02.1: Registo, login e logout através do Firebase Authentication.
- FR-02.2: Recuperação de palavra-passe.
- FR-02.3: Gestão da associação entre utilizadores e tenants.
- FR-02.4: Proteção de páginas privadas.
- FR-02.5: Autorização de operações conforme o papel do utilizador.
- FR-02.6: Acesso administrativo aos dados de autenticação apenas através de operações privilegiadas devidamente autorizadas.

### FR-03 — Gestão de clientes

- FR-03.1: Criar, consultar, editar e arquivar clientes.
- FR-03.2: Guardar nome, telefone, email opcional, notas e preferências.
- FR-03.3: Pesquisar clientes por nome ou telefone.
- FR-03.4: Consultar o histórico de marcações.
- FR-03.5: Identificar possíveis clientes duplicados dentro do mesmo tenant.
- FR-03.6: Restringir todas as consultas ao tenant autorizado.

### FR-04 — Gestão de serviços

- FR-04.1: Criar, editar e desativar serviços.
- FR-04.2: Definir nome, duração e preço.
- FR-04.3: Associar serviços a profissionais.
- FR-04.4: Preservar o nome, a duração e o preço aplicáveis no momento da marcação, mesmo após alterações posteriores ao serviço.

### FR-05 — Gestão de profissionais

- FR-05.1: Criar, editar e desativar profissionais.
- FR-05.2: Associar profissionais a um tenant.
- FR-05.3: Definir os serviços que cada profissional pode executar.
- FR-05.4: Impedir novas marcações para profissionais inativos.

### FR-06 — Gestão de marcações

- FR-06.1: Criar marcações associadas a cliente, serviço, profissional, data e hora.
- FR-06.2: Consultar calendário diário e semanal.
- FR-06.3: Reagendar e cancelar marcações.
- FR-06.4: Alterar o estado para `Scheduled`, `Confirmed`, `Completed`, `Cancelled` ou `NoShow`.
- FR-06.5: Calcular o horário de fim com base na duração do serviço.
- FR-06.6: Detetar conflitos de horário para o mesmo profissional.
- FR-06.7: Respeitar horário de funcionamento e fuso horário do negócio.
- FR-06.8: Registar o valor efetivamente cobrado.
- FR-06.9: Preservar o histórico das alterações relevantes.

### FR-07 — Dashboard

- FR-07.1: Mostrar as marcações do dia.
- FR-07.2: Mostrar contagens por estado.
- FR-07.3: Mostrar a receita das marcações concluídas.
- FR-07.4: Mostrar clientes que precisam de acompanhamento.
- FR-07.5: Permitir navegar para as marcações e os perfis dos clientes.
- FR-07.6: Restringir todos os indicadores ao tenant atual.

### FR-08 — WhatsApp e comunicação

- FR-08.1: Abrir uma conversa de WhatsApp através de um link com mensagem pré-preenchida.
- FR-08.2: Gerar mensagens de confirmação e lembrete.
- FR-08.3: Permitir o envio automático quando a integração com a WhatsApp Business Platform estiver configurada.
- FR-08.4: Registar o estado de envio quando o fornecedor disponibilizar essa informação.
- FR-08.5: Não impedir a gestão de marcações quando o serviço de mensagens falhar.
- FR-08.6: Respeitar preferências de comunicação e os requisitos legais aplicáveis.
- FR-08.7: Permitir configurar lembretes e intervalos de reativação por tenant.

### FR-09 — Retenção de clientes

- FR-09.1: Identificar clientes que não regressaram após um intervalo configurável.
- FR-09.2: Apresentar uma lista de clientes que precisam de acompanhamento.
- FR-09.3: Permitir iniciar uma mensagem de reativação.
- FR-09.4: Excluir clientes que não autorizem comunicações de marketing, conforme os requisitos aplicáveis.
- FR-09.5: Evitar mensagens repetidas para o mesmo cliente e campanha.

### FR-10 — Configurações do negócio

- FR-10.1: Configurar nome, contacto, moeda e fuso horário.
- FR-10.2: Configurar horário de funcionamento.
- FR-10.3: Configurar intervalos dos lembretes.
- FR-10.4: Configurar serviços e profissionais.
- FR-10.5: Garantir isolamento das configurações por tenant.

## 3. Requisitos não funcionais

| ID     | Categoria       | Requisito                                                                                    |
| ------ | --------------- | -------------------------------------------------------------------------------------------- |
| NFR-01 | Segurança       | Firestore Security Rules devem negar acesso por defeito e verificar tenant e papel.          |
| NFR-02 | Isolamento      | Nenhum cliente deve conseguir ler ou modificar dados de outro tenant.                        |
| NFR-03 | Performance     | Consultas comuns devem atingir p95 inferior a 300 ms em condições de teste representativas.  |
| NFR-04 | Escalabilidade  | A aplicação deve suportar múltiplos negócios sem instância de aplicação por tenant.          |
| NFR-05 | Consistência    | Marcações concorrentes não podem ocupar o mesmo slot de um profissional.                     |
| NFR-06 | Disponibilidade | A indisponibilidade do serviço de mensagens não deve bloquear o CRM.                         |
| NFR-07 | Manutenção      | Código organizado por funcionalidades, com validação e regras de negócio testáveis.          |
| NFR-08 | Privacidade     | Minimização de dados pessoais, controlo de acesso, retenção e eliminação adequada dos dados. |
| NFR-09 | Observabilidade | Registar erros, falhas de operações automáticas e métricas relevantes.                       |
| NFR-10 | Portabilidade   | Ambiente local reproduzível através de Docker Compose e Firebase Emulator Suite.             |
| NFR-11 | Testes          | Testes unitários, integração, autorização e isolamento entre pelo menos dois tenants.        |
| NFR-12 | Recuperação     | Definir e testar estratégia de backup e recuperação do Firestore.                            |

Os objetivos de performance devem ser confirmados em testes; dependem do volume de dados, índices, região, rede e padrão de utilização.

## 4. Modelo de dados no Firestore

Uma estrutura inicial possível:

```
users/{userId}

tenants/{tenantId}
  name
  timezone
  currency
  createdAt

tenants/{tenantId}/members/{userId}

tenants/{tenantId}/customers/{customerId}

tenants/{tenantId}/services/{serviceId}

tenants/{tenantId}/professionals/{professionalId}

tenants/{tenantId}/appointments/{appointmentId}

tenants/{tenantId}/settings/general

tenants/{tenantId}/messageLogs/{messageId}
```

Esta organização torna o tenant explícito no caminho dos documentos, simplificando a definição das Security Rules.

No entanto, o caminho do documento não é, por si só, uma garantia de segurança. As regras devem verificar a identidade do utilizador e a respetiva associação ao tenant. Os acessos feitos pelo Admin SDK através de Cloud Functions não são protegidos pelas Security Rules, pelo que precisam de validação de autorização própria.

Para o MVP, mantenha os dados operacionais dentro do tenant e evite duplicar dados pessoais desnecessariamente.


## 6. Docker e Docker Compose

Serviços sugeridos para desenvolvimento:

| Serviço             | Responsabilidade                                          |
| ------------------- | --------------------------------------------------------- |
| `web`               | Aplicação Next.js                                         |
| `firebase-emulator` | Authentication, Firestore e outros emuladores necessários |

O `docker-compose.yml` deverá:

- Construir a aplicação Next.js a partir do Dockerfile.
- Executar os emuladores Firebase localmente.
- Configurar variáveis de ambiente através de `.env`.
- Persistir dados dos emuladores quando necessário.
- Separar as credenciais de desenvolvimento das credenciais de produção.
- Documentar os comandos para iniciar, testar e limpar o ambiente.

Não é necessário executar uma instância própria de Firestore em produção: o banco de dados é um serviço gerido pela Google. O emulador destina-se ao desenvolvimento e aos testes.

## 7. Ordem de implementação

1. Configurar Next.js, Tailwind CSS, Docker e Firebase Emulator Suite.
2. Implementar autenticação, tenants, associação de utilizadores e Security Rules.
3. Implementar clientes, serviços e profissionais.
4. Implementar calendário, marcações e prevenção de conflitos.
5. Implementar dashboard e métricas básicas.
6. Adicionar links WhatsApp, preferências de comunicação e reativação.
7. Testar isolamento, desempenho, recuperação e colocar a versão piloto em produção.