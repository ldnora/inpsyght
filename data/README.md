# Dataset de perguntas e feedbacks

Os dados dos dois datasets foram extaídos do arquivo `CT- Programa de Autoconhecimento para Graduandos do Centro de Tecnologia (UFSM).pdf`.

## Datasets

### Dataset `form.csv`

O dataset `form.csv` possui as os fatores, facetas, perguntas e feedbacks (níveis alto, baixo e médio) para cada uma das perguntas. 

Ele possui as seguintes colunas, sendo que todas elas estão nomeadas em inglês: 

`factor_id,factor_name,facet_id,facet_name,question_id,question,alternative_1,alternative_2,alternative_3,alternative_4,alternative_5,low_feedback,medium_feedback,high_feedback`

- Cada `factor` possui n `facets`. Cada `facet` possui n `questions`. Cada `question` possui 5 `alternatives` 3 feedbacks (baxo, médio e alto)


### Dataset `feedbacks_by_facets.csv`

O dataset `feedbacks_by_facets.csv` possui todos os feedbacks (níveis alto, baixo e médio) de cada uma das facetas.

Ele possui as seguintes colunas, sendo que todas elas estão nomeadas em inglês: 

`factor_id,factor_name,facet_id,facet_name,level,definition,characteristics,potential_benefits,potential_difficulties,general_strategies_tips,conclusion`

- Cada `factor` possui n `facets`. Cada `facet` possui 3 `levels` (alto, baixo e médio). Cada nível possui sua `definition`, `characteristics`, `potential_benefits`, `potential_difficulties`, `general_strategies_tips` e `conclusion`

## Observações

- As colunas `factor_id`, `factor_name`, `facet_id` e `facet_name` possuem os mesmos valores;
