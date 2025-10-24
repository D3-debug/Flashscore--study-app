import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { News } from "@/models";
import { NewsController } from "@/controllers/newsController";

interface FilterQueryString {
  page?: string;
  limit?: string;
  tags?: string;
  author?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  order?: string;
}

async function newsRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (request: FastifyRequest<{ Querystring: FilterQueryString }>, reply: FastifyReply) => {
    try {
      const {
        page = "1",
        limit = "20",
        tags,
        author,
        search,
        startDate,
        endDate,
        sortBy = "publishedAt",
        order = "desc"
      } = request.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = { isActive: true };

      if (tags) {
        const tagArray = tags.split(",").map(t => t.trim());
        filter.tags = { $in: tagArray };
      }

      if (author) {
        filter.author = new RegExp(author, "i");
      }

      if (search) {
        filter.$text = { $search: search };
      }

      if (startDate || endDate) {
        filter.publishedAt = {};
        if (startDate) filter.publishedAt.$gte = new Date(startDate);
        if (endDate) filter.publishedAt.$lte = new Date(endDate);
      }

      const sortOptions: any = {};
      sortOptions[sortBy] = order === "asc" ? 1 : -1;

      const [news, total] = await Promise.all([
        News.find(filter)
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum),
        News.countDocuments(filter)
      ]);

      return reply.send({
        success: true,
        data: news,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch news";
      return reply.status(500).send({ error: message });
    }
  });

  fastify.get("/:id", NewsController.getNewsById);

  fastify.post("/", NewsController.createNews);

  fastify.put("/:id", NewsController.updateNews);

  fastify.patch("/:id", NewsController.updateNews);

  fastify.delete("/:id", NewsController.deleteNews);

  fastify.get("/latest", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const news = await News.find({ isActive: true })
        .sort({ publishedAt: -1 })
        .limit(5);
      return reply.send({
        success: true,
        data: news
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch latest news";
      return reply.status(500).send({ error: message });
    }
  });

  fastify.get("/tags/all", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await News.aggregate([
        { $match: { isActive: true } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags" } },
        { $sort: { _id: 1 } }
      ]);
      const tags = result.map(item => item._id);
      return reply.send({
        success: true,
        data: tags
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch tags";
      return reply.status(500).send({ error: message });
    }
  });

  fastify.get("/authors/all", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await News.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$author" } },
        { $sort: { _id: 1 } }
      ]);
      const authors = result.map(item => item._id);
      return reply.send({
        success: true,
        data: authors
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch authors";
      return reply.status(500).send({ error: message });
    }
  });
}

export { newsRoutes };