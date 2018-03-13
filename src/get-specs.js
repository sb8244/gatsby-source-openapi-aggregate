const optionsValidator = require('./options-validator')
const specProcessorFactory = require('./processors/factory')

const displayErrors = (errors, logger) => {
  logger.error(
    `The provided gatsby-source-openapi-aggregate options are invalid:`
  )
  errors.forEach(error => {
    logger.error(`option: '${error.name}', error: ${error.messages.join(',')}`)
  })
}

const validateOptions = options => {
  const validation = optionsValidator(options)
  if (!validation.isValid) {
    displayErrors(validation.errors, logger)
    throw new Error('The provided options are invalid.')
  }
}

const getSpecs = async (options, logger) => {
  validateOptions(options)

  return Promise.all(
    options.specs.map(async spec => {
      let content = null
      try {
        content = await spec.resolve()
      } catch (exception) {
        logger.warning(
          `There was an error resolving spec '${spec.name}', ${exception.name} ${exception.message} ${exception.stack}`
        )
      }

      if (!content) {
        return null
      }

      try {
        const processor = specProcessorFactory(logger)(content)
        return await processor(spec.name, content)
      } catch (exception) {
        logger.warning(
          `There was an error processing spec '${spec.name}', ${exception.name} ${exception.message} ${exception.stack}`
        )
      }
    })
  )
}

module.exports = getSpecs