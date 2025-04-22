using Ordering.Domain.Abstractions;

namespace Ordering.Infrastructure.RepositoryAdapters;

public class Repository<T>(ApplicationDbContext db)
    : IRepository<T> where T : class, IAggregate
{
    private readonly ApplicationDbContext _db = db;
    private DbSet<T> Entity => _db.Set<T>();

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await Entity.FindAsync([id], cancellationToken);
    }

    public async Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await Entity.FindAsync([id], cancellationToken);
    }

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await Entity.AddAsync(entity, cancellationToken);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        Entity.Update(entity);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        Entity.Remove(entity);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _db.SaveChangesAsync(cancellationToken);
    }
}
