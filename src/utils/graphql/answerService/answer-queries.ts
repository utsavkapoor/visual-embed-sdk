const bachSessionId = `
id {
    sessionId
    genNo
    acSession {
        sessionId
        genNo
    }
}
`;

export const getUnaggregatedAnswerSession = `
mutation GetUnAggregatedAnswerSession($session: BachSessionIdInput!, $columns: [UserPointSelectionInput!]!) {
    Answer__getUnaggregatedAnswer(session: $session, columns: $columns) {
        ${bachSessionId}
        answer {
            visualizations {
                ... on TableViz {
                    columns {
                        column {
                            id
                            name
                            referencedColumns {
                                guid
                                displayName
                            }
                        }
                    }
                }
            }
        }
    }
}  
`;

export const removeColumns = `
mutation RemoveColumns($session: BachSessionIdInput!, $logicalColumnIds: [GUID!], $columnIds: [GUID!]) {
    Answer__removeColumns(
        session: $session
        logicalColumnIds: $logicalColumnIds
        columnIds: $columnIds
        ) {
            ${bachSessionId}
    }
}
    `;

export const addColumns = `
    mutation AddColumns($session: BachSessionIdInput!, $columns: [AnswerColumnInfo!]!) {
        Answer__addColumn(session: $session, columns: $columns) {
            ${bachSessionId}
        }
    }
    `;

export const addFilter = `
    mutation AddUpdateFilter($session: BachSessionIdInput!, $params: AddUpdateFilterInput!) {
        Answer__addUpdateFilter(session: $session, params: $params) {
            ${bachSessionId}
        }
    }
`;

export const getAnswer = `
    query GetAnswer($session: BachSessionIdInput!) {
        getAnswer(session: $session) {
            ${bachSessionId}
            answer {
                id
                name
                description
                displayMode
                sources {
                    header {
                        guid
                        displayName
                    }
                }
                filterGroups {
                    columnInfo {
                        name
                        referencedColumns {
                            guid
                            displayName
                        }
                    }
                    filters {
                        filterContent {
                            filterType
                            negate
                            value {
                                key
                            }
                        }
                    }
                }
                visualizations {
                    ... on TableViz {
                        columns {
                            column {
                                id
                                name
                                referencedColumns {
                                    guid
                                    displayName
                                }
                            }
                        }
                    }
                }
            }
        }
    }

`;

export const getAnswerData = `
    query GetTableWithHeadlineData($session: BachSessionIdInput!, $deadline: Int!, $dataPaginationParams: DataPaginationParamsInput!) {
        getAnswer(session: $session) {
            ${bachSessionId}
            answer {
                id
                visualizations {
                    id
                    ... on TableViz {
                        columns {
                            column {
                                id
                                name
                                type
                                aggregationType
                                dataType
                            }
                        }
                        data(deadline: $deadline, pagination: $dataPaginationParams)
                    }          
                }
            }
        }
    }
`;

export const addVizToLiveboard = `
    mutation AddVizToLiveboard(liveboardId: GUID!, session: BachSessionIdInput!, tabId: GUID, vizId: GUID!) {
        Answer__addVizToPinboard(
            pinboardId: liveboardId

            session: $session

            tabId: $tabId

            vizId: $vizId
        ) {
            ${bachSessionId}
        }
    }
`;
