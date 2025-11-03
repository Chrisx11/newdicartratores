/**
 * Remove todos os dados fictícios do localStorage
 */
export const clearTestData = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  // Limpar dados de clientes fictícios conhecidos
  const clientesFicticios = [
    'João Silva',
    'Maria Santos',
    'Empresa ABC Ltda',
    'Pedro Oliveira',
    'Comércio XYZ EIRELI'
  ];

  // Limpar dados de fornecedores fictícios conhecidos
  const fornecedoresFicticios = [
    'Fornecedor de Peças São Paulo',
    'Distribuidora de Tractor Parts',
    'Carlos Mendes - Revenda',
    'Indústria de Implementos RS',
    'Fabricante Agrícola MG'
  ];

  // Limpar dados de produtos fictícios conhecidos
  const produtosFicticios = [
    'P001', 'P002', 'P003', 'P004', 'P005',
    'P006', 'P007', 'P008', 'P009', 'P010'
  ];

  try {
    // Remover clientes fictícios
    const clientes = localStorage.getItem('clientes');
    if (clientes) {
      const clientesArray = JSON.parse(clientes);
      const clientesLimpos = clientesArray.filter(
        (c: any) => !clientesFicticios.includes(c.nome)
      );
      if (clientesLimpos.length > 0) {
        localStorage.setItem('clientes', JSON.stringify(clientesLimpos));
      } else {
        localStorage.removeItem('clientes');
      }
    }

    // Remover fornecedores fictícios
    const fornecedores = localStorage.getItem('fornecedores');
    if (fornecedores) {
      const fornecedoresArray = JSON.parse(fornecedores);
      const fornecedoresLimpos = fornecedoresArray.filter(
        (f: any) => !fornecedoresFicticios.includes(f.nome)
      );
      if (fornecedoresLimpos.length > 0) {
        localStorage.setItem('fornecedores', JSON.stringify(fornecedoresLimpos));
      } else {
        localStorage.removeItem('fornecedores');
      }
    }

    // Remover produtos fictícios
    const produtos = localStorage.getItem('produtos');
    if (produtos) {
      const produtosArray = JSON.parse(produtos);
      const produtosLimpos = produtosArray.filter(
        (p: any) => !produtosFicticios.includes(p.codigo)
      );
      if (produtosLimpos.length > 0) {
        localStorage.setItem('produtos', JSON.stringify(produtosLimpos));
      } else {
        localStorage.removeItem('produtos');
      }
    }

    // Limpar vendas que referenciam produtos fictícios
    const vendas = localStorage.getItem('saidas');
    if (vendas) {
      const vendasArray = JSON.parse(vendas);
      const vendasLimpos = vendasArray.filter((v: any) => {
        // Verificar se a venda tem produtos fictícios
        const temProdutosFicticios = (v.produtos || []).some((p: any) =>
          produtosFicticios.includes(p.produtoId)
        );
        return !temProdutosFicticios;
      });
      if (vendasLimpos.length > 0) {
        localStorage.setItem('saidas', JSON.stringify(vendasLimpos));
      } else {
        localStorage.removeItem('saidas');
      }
    }

    // Limpar entradas que referenciam produtos fictícios
    const entradas = localStorage.getItem('entradas');
    if (entradas) {
      const entradasArray = JSON.parse(entradas);
      const entradasLimpos = entradasArray.filter((e: any) => {
        // Verificar se a entrada tem produtos fictícios
        const temProdutosFicticios = (e.itens || []).some((i: any) =>
          produtosFicticios.includes(i.produtoId || i.codigo)
        );
        return !temProdutosFicticios;
      });
      if (entradasLimpos.length > 0) {
        localStorage.setItem('entradas', JSON.stringify(entradasLimpos));
      } else {
        localStorage.removeItem('entradas');
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao limpar dados fictícios:', error);
    return false;
  }
};

