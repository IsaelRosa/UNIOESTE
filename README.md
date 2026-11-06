# SISPROM-BR 360º — Protótipo funcional

Sistema de Monitoramento do Plano Estadual da Juventude do Paraná (399 municípios).
Protótipo navegável produzido pela **Cronos Tecnologia e Sistemas** para demonstração de escopo à UNIOESTE, cobrindo os sete módulos do edital.

> Stack do protótipo: Next.js (App Router) + PostgreSQL/Drizzle ORM. A implementação contratada segue o edital: **Java + Microsoft SQL Server + microsserviços + REST/JSON + CELEPAR**. O dossiê de conformidade está em `/arquitetura`.

## Contas de demonstração

Senha para todas: `Sisprom@2026`

| E-mail | Perfil | Escopo |
| --- | --- | --- |
| `admin@juventude.pr.gov.br` | Gestão estadual (administrador) | Estado |
| `tecnico.estado@juventude.pr.gov.br` | Equipe técnica estadual | Estado |
| `gestor@cascavel.pr.gov.br` | Gestor municipal | Cascavel |
| `tecnico@cascavel.pr.gov.br` | Equipe técnica municipal | Cascavel |
| `gestor@curitiba.pr.gov.br` | Gestor municipal | Curitiba |
| `tecnico@maringa.pr.gov.br` | Equipe técnica municipal | Maringá |

O portal público (`/transparencia`) e o dossiê técnico (`/arquitetura`) não exigem login.

## Módulos implementados

1. **Painel administrativo estadual** — `/painel`, `/painel/plano` (eixos → objetivos → metas → ações → indicadores, cadastro de metas).
2. **Área dos municípios** — `/painel/municipios`, `/painel/municipios/[id]`, `/municipal`.
3. **Equipe técnica e fluxo de aprovação** — `/municipal/indicadores`, `/municipal/equipe`, `/painel/validacao`.
4. **Dashboards e relatórios** — `/painel/relatorios`, exportação XLSX/CSV em `/api/export`.
5. **Mapa georreferenciado** — `/painel/mapa` (malha do Paraná + coordenadas reais dos 399 municípios).
6. **Portal público de transparência** — `/transparencia`, `/transparencia/municipio/[id]`, API agregada `/api/public/indicadores`.
7. **Integração entre políticas** — `/painel/integracoes` (malha de conexões entre metas e planos setoriais).

Governança: `/painel/auditoria` (trilha de auditoria, matriz RBAC, integrações, controles de segurança).

## Regras de negócio principais

- Ciclos de monitoramento `2024` e `2025`; execução calculada por indicador (`valor / referência`, invertido quando `menor_melhor`, limitado a 100%).
- Fluxo: equipe técnica envia → gestor municipal aprova ou solicita correção → gestão estadual valida e consolida.
- Portal público expõe apenas dados agregados (LGPD), sem qualquer dado pessoal.
- Toda escrita gera evento na trilha de auditoria com usuário, perfil, entidade e detalhe.
- RBAC aplicado no servidor: administrador estadual, técnico estadual, gestor municipal e técnico municipal; escopo territorial nos perfis municipais.

## Scripts

```bash
npx drizzle-kit push        # aplica o schema
node scripts/seed.mjs       # popula municípios, plano, resultados e auditoria
node scripts/prepare-geo.mjs  # regenera malha do PR e municípios a partir de bases públicas
npm run build && npm start  # produção
```

Fontes públicas: dataset "Municípios Brasileiros" (códigos IBGE, latitude/longitude) e malha do Paraná simplificada (GeoJSON público).
Regionalização por polos é aproximada no protótipo e parametrizável pela regionalização oficial.
