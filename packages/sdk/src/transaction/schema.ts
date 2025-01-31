export const schema: any = {
  struct: {
    transfer: {
      option: {
        struct: {
          transfers: {
            array: {
              type: {
                struct: {
                  asset: { array: { type: { array: { type: 'u8' } }, len: 2 } }, // VARUINT BlockTxTuple
                  output: { array: { type: 'u8' } }, // VARUINT
                  amount: { array: { type: 'u8' } }, // VARUINT
                }
              },
              showLen: true
            }
          }
        }
      }
    },
    contract_creation: {
      option: {
        struct: {
          contract_type: {
            enum:
              [
                {
                  struct: {
                    moa: {
                      struct: {
                        ticker: {
                          option: {
                            struct: {
                              number: { array: { type: 'u8' } },
                              spacers: { option: { array: { type: 'u8' } } }
                            }
                          }
                        },
                        supply_cap: { option: { array: { type: 'u8' } } }, // VARUINT
                        divisibility: 'u8',
                        live_time: 'i64',
                        end_time: { option: 'i64' },
                        mint_mechanism: {
                          struct: {
                            preallocated: {
                              option: {
                                struct: {
                                  allocations: { // TODO, lacking 8 bytes compared to Core (from HashMap..??)
                                    map: {
                                      key: { array: { type: 'u8' } }, // VARUINT
                                      value: {
                                        enum: [
                                          {
                                            struct: { vec_pubkey: { array: { type: { array: { type: 'u8', showLen: true } }, showLen: true } } },
                                          },
                                          {
                                            struct: {
                                              bloom_filter: {
                                                struct: {
                                                  filter: { array: { type: 'u8' } },
                                                  arg: {
                                                    enum: [{ struct: { tx_id: { struct: {} } } }]
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  },
                                  vesting_plan: { // TODO, length of array is also encoded in Core
                                    option: {
                                      enum: [
                                        { struct: { timelock: 'i64' } },
                                        {
                                          struct: {
                                            scheduled: {
                                              array: {
                                                type: {
                                                  struct: {
                                                    ratio: { array: { type: { array: { type: 'u8' } }, len: 2 } },
                                                    tolerance: 'i64'
                                                  }
                                                },
                                                showLen: true
                                              }
                                            }
                                          }
                                        }
                                      ]
                                    }
                                  }
                                }
                              }
                            },
                            free_mint: {
                              option: {
                                struct: {
                                  supply_cap: { option: { array: { type: 'u8' } } }, // VARUINT
                                  amount_per_mint: { array: { type: 'u8' } }, // VARUINT
                                }
                              }
                            },
                            purchase: {
                              option: {
                                struct: {
                                  input_asset: {
                                    enum: [
                                      { struct: { raw_btc: { struct: {} } } },
                                      { struct: { glittr_asset: { array: { type: { array: { type: 'u8' } }, len: 2 } } } }, // VARUINT Blocktxtuple
                                      { struct: { rune: { struct: {} } } },
                                      { struct: { ordinal: { struct: {} } } }
                                    ]
                                  },
                                  pay_to_key: { option: { array: { type: 'u8' } } },
                                  ratio: {
                                    enum: [
                                      {
                                        struct: {
                                          fixed: {
                                            struct: {
                                              ratio: { array: { type: { array: { type: 'u8' } }, len: 2 } } // VARUINT Fraction
                                            }
                                          }
                                        }
                                      },
                                      {
                                        struct: {
                                          oracle: {
                                            struct: {
                                              setting: {
                                                struct: {
                                                  pubkey: { array: { type: 'u8' } },
                                                  asset_id: { option: 'string' },
                                                  block_height_slippage: 'u8'
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }]
                                  }
                                }
                              }
                            },
                          }
                        },
                        commitment: {
                          option: {
                            struct: {
                              public_key: { array: { type: 'u8' } },
                              args: {
                                struct: {
                                  fixed_string: {
                                    option: {
                                      struct: {
                                        number: { array: { type: 'u8' } },
                                        spacers: { option: { array: { type: 'u8' } } }
                                      }
                                    }
                                  },
                                  string: 'string'
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                {
                  struct: {
                    mba: {
                      struct: {
                        ticker: {
                          option: {
                            struct: {
                              number: { array: { type: 'u8' } },
                              spacers: { option: { array: { type: 'u8' } } }
                            }
                          }
                        },
                        supply_cap: { option: { array: { type: 'u8' } } }, // VARUINT
                        divisibility: 'u8',
                        live_time: 'i64',
                        end_time: { option: 'i64' },
                        mint_mechanism: {
                          struct: {
                            preallocated: {
                              option: {
                                struct: {
                                  allocations: { // TODO, lacking 8 bytes compared to Core (from HashMap..??)
                                    map: {
                                      key: { array: { type: 'u8' } }, // VARUINT
                                      value: {
                                        enum: [
                                          {
                                            struct: { vec_pubkey: { array: { type: { array: { type: 'u8', showLen: true } }, showLen: true } } },
                                          },
                                          {
                                            struct: {
                                              bloom_filter: {
                                                struct: {
                                                  filter: { array: { type: 'u8' } },
                                                  arg: {
                                                    enum: [{ struct: { tx_id: { struct: {} } } }]
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  },
                                  vesting_plan: { // TODO, length of array is also encoded in Core
                                    option: {
                                      enum: [
                                        { struct: { timelock: 'i64' } },
                                        {
                                          struct: {
                                            scheduled: {
                                              array: {
                                                type: {
                                                  struct: {
                                                    ratio: { array: { type: { array: { type: 'u8' } }, len: 2 } },
                                                    tolerance: 'i64'
                                                  }
                                                },
                                                showLen: true
                                              }
                                            }
                                          }
                                        }
                                      ]
                                    }
                                  }
                                }
                              }
                            },
                            free_mint: {
                              option: {
                                struct: {
                                  supply_cap: { option: { array: { type: 'u8' } } }, // VARUINT
                                  amount_per_mint: { array: { type: 'u8' } }, // VARUINT
                                }
                              }
                            },
                            purchase: {
                              option: {
                                struct: {
                                  input_asset: {
                                    enum: [
                                      { struct: { raw_btc: { struct: {} } } },
                                      { struct: { glittr_asset: { array: { type: { array: { type: 'u8' } }, len: 2 } } } }, // VARUINT Blocktxtuple
                                      { struct: { rune: { struct: {} } } },
                                      { struct: { ordinal: { struct: {} } } }
                                    ]
                                  },
                                  pay_to_key: { option: { array: { type: 'u8' } } },
                                  ratio: {
                                    enum: [
                                      {
                                        struct: {
                                          fixed: {
                                            struct: {
                                              ratio: { array: { type: { array: { type: 'u8' } }, len: 2 } } // VARUINT Fraction
                                            }
                                          }
                                        }
                                      },
                                      {
                                        struct: {
                                          oracle: {
                                            struct: {
                                              setting: {
                                                struct: {
                                                  pubkey: { array: { type: 'u8' } },
                                                  asset_id: { option: 'string' },
                                                  block_height_slippage: 'u8'
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }]
                                  }
                                }
                              }
                            },
                            collateralized: {
                              option: {
                                struct: {
                                  input_asset: {
                                    enum: [
                                      { struct: { raw_btc: { struct: {} } } },
                                      { struct: { glittr_asset: { array: { type: { array: { type: 'u8' } }, len: 2 } } } }, // VARUINT Blocktxtuple
                                      { struct: { rune: { struct: {} } } },
                                      { struct: { ordinal: { struct: {} } } }
                                    ]
                                  },
                                  _mutable_assets: 'bool',
                                  mint_structure: {
                                    enum: [
                                      {
                                        struct: {
                                          ratio: {
                                            enum: [
                                              {
                                                struct: {
                                                  fixed: {
                                                    struct: {
                                                      ratio: { array: { type: { array: { type: 'u8' } }, len: 2 } } // VARUINT Fraction
                                                    }
                                                  }
                                                }
                                              },
                                              {
                                                struct: {
                                                  oracle: {
                                                    struct: {
                                                      setting: {
                                                        struct: {
                                                          pubkey: { array: { type: 'u8' } },
                                                          asset_id: { option: 'string' },
                                                          block_height_slippage: 'u8'
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }]
                                          }
                                        }
                                      },
                                      {
                                        struct: {
                                          proportional: {
                                            struct: {
                                              ratio_model: { enum: [{ struct: { constant_product: { struct: {} } } }] },
                                              inital_mint_pointer_to_key: { option: { array: { type: 'u8' } } }, //VARUINT
                                            }
                                          }
                                        }
                                      },
                                      {
                                        struct: {
                                          account: {
                                            struct: {
                                              max_ltv: { array: { type: { array: { type: 'u8' } }, len: 2 } }, // VARUINT Fraction
                                              ratio: {
                                                enum: [
                                                  {
                                                    struct: {
                                                      fixed: {
                                                        struct: {
                                                          ratio: { array: { type: { array: { type: 'u8' } }, len: 2 } } // VARUINT Fraction
                                                        }
                                                      }
                                                    }
                                                  },
                                                  {
                                                    struct: {
                                                      oracle: {
                                                        struct: {
                                                          setting: {
                                                            struct: {
                                                              pubkey: { array: { type: 'u8' } },
                                                              asset_id: { option: 'string' },
                                                              block_height_slippage: 'u8'
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }]
                                              }
                                            }
                                          }
                                        }
                                      }]
                                  }
                                }
                              }
                            }
                          }
                        },
                        burn_mechanism: {
                          struct: {
                            return_collateral: {
                              option: {
                                struct: {
                                  fee: { option: { array: { type: { array: { type: 'u8' } }, len: 2 } } }, // VARUINT Fraction
                                  oracle_setting: {
                                    option: {
                                      struct: {
                                        pubkey: { array: { type: 'u8' } },
                                        asset_id: { option: 'string' },
                                        block_height_slippage: 'u8'
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        },
                        swap_mechanism: {
                          struct: {
                            fee: { option: { array: { type: 'u8' } } }, // VARUINT
                          }
                        },
                        commitment: {
                          option: {
                            struct: {
                              public_key: { array: { type: 'u8' } },
                              args: {
                                struct: {
                                  fixed_string: {
                                    option: {
                                      struct: {
                                        number: { array: { type: 'u8' } },
                                        spacers: { option: { array: { type: 'u8' } } }
                                      }
                                    }
                                  },
                                  string: 'string'
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                {
                  struct: {
                    spec: {
                      struct: {
                        spec: {
                          enum: [
                            {
                              struct: {
                                mint_only_asset: {
                                  struct: {
                                    input_asset: {
                                      option: {
                                        enum: [
                                          { struct: { raw_btc: { struct: {} } } },
                                          { struct: { glittr_asset: { array: { type: { array: { type: 'u8' } }, len: 2 } } } }, // VARUINT Blocktxtuple
                                          { struct: { rune: { struct: {} } } },
                                          { struct: { ordinal: { struct: {} } } }
                                        ]
                                      },
                                    },
                                    peg_in_type: {
                                      option: {
                                        enum: [
                                          { struct: { pubkey: { array: { type: 'u8' } } } },
                                          { struct: { burn: { struct: {} } } }
                                        ]
                                      }
                                    }
                                  }
                                }
                              }
                            },
                            {
                              struct: {
                                mint_burn_asset: {
                                  struct: {
                                    collateralized: {
                                      option: {
                                        struct: {
                                          _mutable_assets: 'bool',
                                          input_asset: {
                                            option: {
                                              array: {
                                                type: {
                                                  enum: [
                                                    { struct: { raw_btc: { struct: {} } } },
                                                    { struct: { glittr_asset: { array: { type: { array: { type: 'u8' } }, len: 2 } } } }, // VARUINT Blocktxtuple
                                                    { struct: { rune: { struct: {} } } },
                                                    { struct: { ordinal: { struct: {} } } }
                                                  ]
                                                }
                                              }
                                            }
                                          },
                                          mint_structure: {
                                            option: {
                                              enum: [
                                                {
                                                  struct: {
                                                    ratio: {
                                                      enum: [
                                                        {
                                                          struct: {
                                                            fixed: {
                                                              struct: {
                                                                ratio: { array: { type: { array: { type: 'u8' } }, len: 2 } } // VARUINT Fraction
                                                              }
                                                            }
                                                          }
                                                        },
                                                        {
                                                          struct: {
                                                            oracle: {
                                                              struct: {
                                                                setting: {
                                                                  struct: {
                                                                    pubkey: { array: { type: 'u8' } },
                                                                    asset_id: { option: 'string' },
                                                                    block_height_slippage: 'u8'
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }]
                                                    }
                                                  }
                                                },
                                                {
                                                  struct: {
                                                    proportional: {
                                                      struct: {
                                                        ratio_model: { enum: [{ struct: { constant_product: { struct: {} } } }] },
                                                        inital_mint_pointer_to_key: { option: { array: { type: 'u8' } } }, //VARUINT
                                                      }
                                                    }
                                                  }
                                                },
                                                {
                                                  struct: {
                                                    account: {
                                                      struct: {
                                                        max_ltv: { array: { type: { array: { type: 'u8' } }, len: 2 } }, // VARUINT Fraction
                                                        ratio: {
                                                          enum: [
                                                            {
                                                              struct: {
                                                                fixed: {
                                                                  struct: {
                                                                    ratio: { array: { type: { array: { type: 'u8' } }, len: 2 } } // VARUINT Fraction
                                                                  }
                                                                }
                                                              }
                                                            },
                                                            {
                                                              struct: {
                                                                oracle: {
                                                                  struct: {
                                                                    setting: {
                                                                      struct: {
                                                                        pubkey: { array: { type: 'u8' } },
                                                                        asset_id: { option: 'string' },
                                                                        block_height_slippage: 'u8'
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }]
                                                        }
                                                      }
                                                    }
                                                  }
                                                }]
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            },
                          ]
                        },
                        pointer: { option: { array: { type: 'u8' } } }, //VARUINT
                        block_tx: { option: { array: { type: { array: { type: 'u8' } }, len: 2 } } } //VARUINT BlockTxTuple
                      }
                    }
                  }
                }
              ]
          },
          spec: { option: { array: { type: { array: { type: 'u8' } }, len: 2 } } }, //VARUINT BlockTxTuple
        }
      }
    },
    contract_call: {
      option: {
        struct: {
          contract: { option: { array: { type: { array: { type: 'u8' } }, len: 2 } } }, // VARUINT BlockTxTuple
          call_type: {
            enum: [
              {
                struct: {
                  mint: {
                    struct: {
                      pointer: { option: { array: { type: 'u8' } } }, //VARUINT
                      oracle_message: {
                        option: {
                          struct: {
                            signature: { array: { type: 'u8' } },
                            message: {
                              struct: {
                                input_outpoint: { option: { struct: { txid: 'string', vout: 'u32' } } }, // TODO
                                min_in_value: { option: { array: { type: 'u8' } } }, // VARUINT
                                out_value: { option: { array: { type: 'u8' } } }, // VARUINT
                                asset_id: { option: 'string' },
                                ratio: { option: { array: { type: { array: { type: 'u8' } }, len: 2 } } }, // VARUINT Fraction
                                ltv: { option: { array: { type: { array: { type: 'u8' } }, len: 2 } } }, // VARUINT Fraction
                                outstanding: { option: { array: { type: 'u8' } } }, // VARUINT
                                block_height: { array: { type: 'u8' } } // VARUINT
                              }
                            }
                          }
                        }
                      },
                      pointer_to_key: { option: { array: { type: 'u8' } } },
                      assert_values: {
                        option: {
                          struct: {
                            input_values: { option: { array: { type: { array: { type: 'u8' } } } } }, // VARUINT
                            total_collateralized: { option: { array: { type: { array: { type: 'u8' } } } } }, // VARUINT
                            min_out_value: { option: { array: { type: 'u8' } } }
                          }
                        }
                      },
                      commitment_message: {
                        option: {
                          struct: {
                            public_key: { array: { type: 'u8' } },
                            args: { array: { type: 'u8' } }
                          }
                        }
                      }
                    }
                  }
                }
              },
              {
                struct: {
                  burn: {
                    struct: {
                      pointer: { option: { array: { type: 'u8' } } }, //VARUINT
                      oracle_message: {
                        option: {
                          struct: {
                            signature: { array: { type: 'u8' } },
                            message: {
                              struct: {
                                input_outpoint: { option: { struct: { txid: 'string', vout: 'u32' } } }, // TODO
                                min_in_value: { option: { array: { type: 'u8' } } }, // VARUINT
                                out_value: { option: { array: { type: 'u8' } } }, // VARUINT
                                asset_id: { option: 'string' },
                                ratio: { option: { array: { type: { array: { type: 'u8' } }, len: 2 } } }, // VARUINT Fraction
                                ltv: { option: { array: { type: { array: { type: 'u8' } }, len: 2 } } }, // VARUINT Fraction
                                outstanding: { option: { array: { type: 'u8' } } }, // VARUINT
                                block_height: { array: { type: 'u8' } } // VARUINT
                              }
                            }
                          }
                        }
                      },
                      pointer_to_key: { option: { array: { type: 'u8' } } },
                      assert_values: {
                        option: {
                          struct: {
                            input_values: { option: { array: { type: { array: { type: 'u8' } } } } }, // VARUINT
                            total_collateralized: { option: { array: { type: { array: { type: 'u8' } } } } }, // VARUINT
                            min_out_value: { option: { array: { type: 'u8' } } }
                          }
                        }
                      },
                      commitment_message: {
                        option: {
                          struct: {
                            public_key: { array: { type: 'u8' } },
                            args: { array: { type: 'u8' } }
                          }
                        }
                      }
                    }
                  }
                }
              },
              {
                struct: {
                  swap: {
                    struct: {
                      pointer: { array: { type: 'u8' } },
                      assert_values: {
                        option: {
                          struct: {
                            input_values: { option: { array: { type: { array: { type: 'u8' } } } } }, // VARUINT
                            total_collateralized: { option: { array: { type: { array: { type: 'u8' } } } } }, // VARUINT
                            min_out_value: { option: { array: { type: 'u8' } } }
                          }
                        }
                      },
                    }
                  }
                }
              },
              {
                struct: {
                  open_account: {
                    struct: {
                      pointer_to_key: { array: { type: 'u8' } },
                      share_amount: { array: { type: 'u8' } }
                    }
                  }
                }
              },
              {
                struct: {
                  close_account: {
                    struct: {
                      pointer: { array: { type: 'u8' } }
                    }
                  }
                }
              }
            ]
          }
        }
      }
    }
  }
};
