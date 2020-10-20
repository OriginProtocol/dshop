import useProduct from 'utils/useProduct'
import useConfig from 'utils/useConfig'

function useSingleProduct() {
  const { config } = useConfig()
  const { product } = useProduct(config.singleProduct)

  return product
}

export default useSingleProduct
