const asciidoc = require(`asciidoctor`)();
const config = require('./docs/src/configs/doc-configs');
const { htmlToText } = require('html-to-text');

const buildEnv = process.env.BUILD_ENV || 'LOCAL'; // Default build env

const getPathPrefix = () => {
    switch (buildEnv) {
        case 'PROD':
            return 'release';
        case 'DEV':
        case 'STAGING':
            return 'dev';
        case 'LOCAL':
        default:
            return ''; // Default path prefix
    }
};

const getPath = (path) => `${path}/${getPathPrefix()}`;

class CustomDocConverter {
    constructor() {
        this.baseConverter = asciidoc.Html5Converter.$new();
    }

    /**
     * Check if inline_anchor target is for transformation or not
     * @param {string} target - inline_anchor target i.e. href
     * @returns {boolean} true if transformation is needed else false
     */
    isTransformLink(target) {
        return (
            !target.includes(`{{${config.NAV_PREFIX}}}`) &&
            !target.includes(`{{${config.TS_HOST_PARAM}}}`) &&
            !target.includes('www.') &&
            !target.startsWith('http')
        );
    }

    /**
     * Convert is used to return html node string based on transform or conditions
     * @param {any} node - The concrete instance of AbstractNode to convert.
     * @param {string} transform - An optional string transform that hints at which transformation should be applied to this node.
     * @returns {string} html node string
     */
    convert(node, transform) {
        // checking anchor node type
        if (node.getNodeName() === 'inline_anchor') {
            // get anchor target set inside adoc file
            let target = node.getTarget();

            if (this.isTransformLink(target)) {
                // check if link is for typedoc documents or not
                if (target.includes(config.TYPE_DOC_PREFIX)) {
                    return `<a href="${
                        getPath(config.DOC_REPO_NAME) + target
                    }">${node.getText()}</a>`;
                }

                if (!target.startsWith('#')) {
                    target = target.substring(
                        target.lastIndexOf(':') + 1,
                        target.lastIndexOf('.html'),
                    );
                    return `<a href="{{${
                        config.NAV_PREFIX
                    }}}={{${target}}}">${node.getText()}</a>`;
                }
            }
        }

        return this.baseConverter.convert(node, transform);
    }
}

module.exports = {
    pathPrefix: getPath(config.DOC_REPO_NAME),
    siteMetadata: {
        title: 'tseverywhere-docs',
    },
    plugins: [
        'gatsby-plugin-sass',
        {
            resolve: 'gatsby-plugin-page-creator',
            options: {
                path: `${__dirname}/docs/src/pages`,
            },
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'pages',
                path: `${__dirname}/docs/src/pages/`,
            },
            __key: 'pages',
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'asciidocs',
                path: `${__dirname}/docs/src/asciidocs/`,
            },
            __key: 'asciidocs',
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'common',
                path: `${__dirname}/docs/src/asciidocs/common/`,
            },
            __key: 'asciidocs_common',
        },
        {
            resolve: 'gatsby-plugin-intl',
            options: {
                // language JSON resource path
                path: `${__dirname}/docs/src/intl`,
                // supported language
                languages: ['en'],
                // language file path
                defaultLanguage: 'en',
                // option to redirect to `/en` when connecting `/`
                redirect: true,
            },
        },
        {
            resolve: 'gatsby-transformer-asciidoc',
            options: {
                attributes: {
                    showtitle: true,
                    imagesdir: '/doc-images',
                },
                fileExtensions: ['ad', 'adoc'],
                converterFactory: CustomDocConverter,
            },
        },
        {
            resolve: 'gatsby-plugin-local-search',
            options: {
                name: 'pages',
                engine: 'flexsearch',
                engineOptions: 'speed',
                query: `
                query {
                    allAsciidoc(sort: { fields: [document___title], order: ASC }) {
                        edges {
                            node {
                                document {
                                    title
                                }
                                pageAttributes {
                                    pageid
                                    title
                                    description
                                }
                                html
                            }
                        }
                    }
                    allFile(filter: {sourceInstanceName: {eq: "htmlFiles"}}) {
                        edges {
                          node {
                            extension
                            dir
                            name
                            childHtmlRehype {
                              html
                              htmlAst
                            }
                          }
                        }
                    }
                }
                `,
                ref: 'pageid',
                index: ['title', 'body', 'pageid'],
                store: ['pageid', 'title', 'redirectURL'],
                normalizer: ({ data }) => {
                    return [
                        ...data.allAsciidoc.edges
                            .filter(
                                (edge) =>
                                    edge.node.pageAttributes.pageid &&
                                    edge.node.pageAttributes.pageid !== 'nav',
                            )
                            .map((edge) => {
                                const pageid = edge.node.pageAttributes.pageid;
                                return {
                                    pageid,
                                    redirectURL: `?pageid=${pageid}`,
                                    title: edge.node.document.title,
                                    body: htmlToText(edge.node.html),
                                };
                            }),
                        ...data.allFile.edges
                            .filter((edge) => edge.node.extension === 'html')
                            .map((edge) => {
                                const pageid = edge.node.name;
                                return {
                                    pageid,
                                    redirectURL: pageid,
                                    title: edge.node.childHtmlRehype.htmlAst.children.find(
                                        (children) =>
                                            children.tagName === 'title',
                                    ).children[0].value,
                                    body: htmlToText(
                                        edge.node.childHtmlRehype.html,
                                    ),
                                };
                            }),
                    ];
                },
            },
        },
        {
            resolve: 'gatsby-transformer-rehype',
            options: {
                mediaType: 'text/html',
            },
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'htmlFiles',
                path: `${__dirname}/static/typedoc/`,
            },
            __key: 'htmlFiles',
        },
    ],
};
