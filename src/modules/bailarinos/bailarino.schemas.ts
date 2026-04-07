export const criarBailarinoSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid" },
    },
  },
  body: {
    type: "object",
    required: ["nomeCompleto", "nomeArtistico", "tipoDocumento", "documento", "dataNascimento"],
    properties: {
      nomeCompleto: { type: "string", minLength: 1 },
      nomeArtistico: { type: "string", minLength: 1 },
      tipoDocumento: { enum: ["CPF", "RG"] },
      documento: { type: "string", minLength: 7 },
      dataNascimento: { type: "string", format: "date" },
    },
  },
};

export const listarBailarinosSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid" },
    },
  },
};
